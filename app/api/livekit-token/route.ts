import { AccessToken } from 'livekit-server-sdk'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { roomCode } = await request.json()

  if (!roomCode || typeof roomCode !== 'string') {
    return NextResponse.json({ error: 'Room code is required' }, { status: 400 })
  }

  // Verify room exists
  const { data: room } = await supabase
    .from('rooms')
    .select('id, room_code, name')
    .eq('room_code', roomCode)
    .eq('is_active', true)
    .single()

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  // Track participant
  await supabase.from('participants').insert({
    room_id: room.id,
    user_id: user.id,
  })

  // Generate LiveKit token
  const displayName = user.user_metadata?.full_name || user.email || 'Anonymous'

  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: user.id,
      name: displayName,
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
  })
}
