import { AccessToken } from 'livekit-server-sdk'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST: Create a breakout room
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { parentRoomCode?: string; breakoutName?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { parentRoomCode, breakoutName } = body

  if (!parentRoomCode) {
    return NextResponse.json({ error: 'Parent room code is required' }, { status: 400 })
  }

  // Verify user is creator of the parent room
  const { data: parentRoom } = await supabase
    .from('rooms')
    .select('id, creator_id, room_code')
    .eq('room_code', parentRoomCode)
    .eq('is_active', true)
    .single()

  if (!parentRoom) {
    return NextResponse.json({ error: 'Parent room not found' }, { status: 404 })
  }

  if (parentRoom.creator_id !== user.id) {
    return NextResponse.json({ error: 'Only the room creator can create breakout rooms' }, { status: 403 })
  }

  // Generate a breakout room code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let breakoutCode = ''
  for (let i = 0; i < 6; i++) {
    breakoutCode += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  const name = (breakoutName || 'Breakout Room').replace(/[<>"'&]/g, '').trim().slice(0, 100)

  // Insert the breakout room with parent reference
  const { data: breakoutRoom, error: insertError } = await supabase
    .from('rooms')
    .insert({
      name,
      room_code: breakoutCode,
      creator_id: user.id,
      parent_room_id: parentRoom.id,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({
    breakoutRoom: {
      id: breakoutRoom.id,
      name: breakoutRoom.name,
      room_code: breakoutRoom.room_code,
    },
  })
}

// GET: List breakout rooms for a parent room
export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const parentRoomCode = searchParams.get('parentRoomCode')

  if (!parentRoomCode) {
    return NextResponse.json({ error: 'Parent room code is required' }, { status: 400 })
  }

  const { data: parentRoom } = await supabase
    .from('rooms')
    .select('id')
    .eq('room_code', parentRoomCode)
    .single()

  if (!parentRoom) {
    return NextResponse.json({ error: 'Parent room not found' }, { status: 404 })
  }

  const { data: breakouts } = await supabase
    .from('rooms')
    .select('id, name, room_code, is_active, created_at')
    .eq('parent_room_id', parentRoom.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  // Get participant counts
  const breakoutIds = (breakouts || []).map((b) => b.id)
  let countMap: Record<string, number> = {}

  if (breakoutIds.length > 0) {
    const { data: counts } = await supabase
      .from('participants')
      .select('room_id')
      .in('room_id', breakoutIds)
      .is('left_at', null)

    if (counts) {
      counts.forEach((c: { room_id: string }) => {
        countMap[c.room_id] = (countMap[c.room_id] || 0) + 1
      })
    }
  }

  const result = (breakouts || []).map((b) => ({
    ...b,
    participantCount: countMap[b.id] || 0,
  }))

  return NextResponse.json({ breakoutRooms: result })
}
