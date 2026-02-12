import { AccessToken } from 'livekit-server-sdk'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 10

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

const ROOM_MAX_AGE_HOURS = 24

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
  }

  let body: { roomCode?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { roomCode, password } = body

  if (!roomCode || typeof roomCode !== 'string' || !/^[A-Z0-9]{6}$/.test(roomCode)) {
    return NextResponse.json({ error: 'Invalid room code' }, { status: 400 })
  }

  // Verify room exists and is active
  // Try full query first, fall back to base columns if new columns don't exist yet
  interface RoomData {
    id: string
    room_code: string
    name: string
    created_at: string
    is_active: boolean
    max_participants: number
    creator_id: string
    is_persistent?: boolean
    password_hash?: string | null
    waiting_room_enabled?: boolean
  }
  let room: RoomData | null = null

  const { data: fullRoom, error: fullErr } = await supabase
    .from('rooms')
    .select('id, room_code, name, created_at, is_active, max_participants, creator_id, is_persistent, password_hash, waiting_room_enabled')
    .eq('room_code', roomCode)
    .eq('is_active', true)
    .single()

  if (fullRoom) {
    room = fullRoom as unknown as RoomData
  } else if (fullErr && fullErr.message?.includes('column')) {
    // New columns don't exist yet — query with base columns only
    const { data: baseRoom } = await supabase
      .from('rooms')
      .select('id, room_code, name, created_at, is_active, max_participants, creator_id')
      .eq('room_code', roomCode)
      .eq('is_active', true)
      .single()
    if (baseRoom) {
      room = { ...(baseRoom as unknown as RoomData), is_persistent: false, password_hash: null, waiting_room_enabled: false }
    }
  }

  if (!room) {
    return NextResponse.json({ error: 'Room not found or has ended' }, { status: 404 })
  }

  // Check room expiry (skip for persistent rooms)
  if (!room.is_persistent) {
    const roomAge = Date.now() - new Date(room.created_at).getTime()
    if (roomAge > ROOM_MAX_AGE_HOURS * 60 * 60 * 1000) {
      await supabase.from('rooms').update({ is_active: false }).eq('id', room.id)
      await supabase
        .from('participants')
        .update({ left_at: new Date().toISOString() })
        .eq('room_id', room.id)
        .is('left_at', null)
      return NextResponse.json({ error: 'This meeting has expired' }, { status: 410 })
    }
  }

  // Password check (creator is exempt)
  if (room.password_hash && room.creator_id !== user.id) {
    if (!password) {
      return NextResponse.json({ error: 'This room requires a password', requiresPassword: true }, { status: 403 })
    }
    // Simple comparison (in production use bcrypt)
    if (password !== room.password_hash) {
      return NextResponse.json({ error: 'Incorrect password', requiresPassword: true }, { status: 403 })
    }
  }

  // Check waiting room (lobby)
  if (room.waiting_room_enabled && room.creator_id !== user.id) {
    const { data: lobbyEntry } = await supabase
      .from('lobby')
      .select('status')
      .eq('room_id', room.id)
      .eq('user_id', user.id)
      .single()

    if (!lobbyEntry || lobbyEntry.status !== 'admitted') {
      return NextResponse.json({ error: 'Waiting for host to admit you', requiresLobby: true }, { status: 403 })
    }
  }

  // Check max participants
  const { count } = await supabase
    .from('participants')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', room.id)
    .is('left_at', null)

  if (count !== null && count >= room.max_participants) {
    return NextResponse.json({ error: 'Meeting is full' }, { status: 403 })
  }

  // Track participant
  await supabase.from('participants').insert({
    room_id: room.id,
    user_id: user.id,
  })

  // Fetch avatar for metadata
  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .single()

  const displayName = user.user_metadata?.full_name || user.email || 'Anonymous'
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || null

  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: user.id,
      name: displayName,
      metadata: JSON.stringify({ avatar_url: avatarUrl }),
      ttl: '6h',
    }
  )

  token.addGrant({
    roomJoin: true,
    room: roomCode,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  })

  const jwt = await token.toJwt()

  return NextResponse.json({
    token: jwt,
    roomName: room.name,
    roomCode: room.room_code,
    isCreator: room.creator_id === user.id,
    participantCount: (count || 0) + 1,
    maxParticipants: room.max_participants,
    waitingRoomEnabled: room.waiting_room_enabled || false,
  })
}
