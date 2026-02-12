import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { roomCode?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { roomCode } = body

  if (!roomCode || typeof roomCode !== 'string') {
    return NextResponse.json({ error: 'Room code is required' }, { status: 400 })
  }

  // Verify user is the room creator
  const { data: room } = await supabase
    .from('rooms')
    .select('id, creator_id')
    .eq('room_code', roomCode)
    .single()

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  if (room.creator_id !== user.id) {
    return NextResponse.json({ error: 'Only the room creator can end the meeting' }, { status: 403 })
  }

  // Deactivate room
  await supabase
    .from('rooms')
    .update({ is_active: false })
    .eq('id', room.id)

  // Mark all active participants as left
  await supabase
    .from('participants')
    .update({ left_at: new Date().toISOString() })
    .eq('room_id', room.id)
    .is('left_at', null)

  return NextResponse.json({ success: true })
}
