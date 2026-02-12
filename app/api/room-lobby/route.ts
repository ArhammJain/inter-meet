import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST: Request to join a room (adds to lobby)
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
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { roomCode } = body
  if (!roomCode) {
    return NextResponse.json({ error: 'Room code required' }, { status: 400 })
  }

  const { data: room } = await supabase
    .from('rooms')
    .select('id, creator_id, waiting_room_enabled')
    .eq('room_code', roomCode)
    .eq('is_active', true)
    .single()

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  // If user is creator or waiting room is disabled, auto-admit
  if (room.creator_id === user.id || !room.waiting_room_enabled) {
    return NextResponse.json({ status: 'admitted' })
  }

  // Add to lobby
  const { error: insertError } = await supabase
    .from('lobby')
    .upsert({
      room_id: room.id,
      user_id: user.id,
      display_name: user.user_metadata?.full_name || user.email || 'Anonymous',
      status: 'waiting',
    }, {
      onConflict: 'room_id,user_id',
    })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ status: 'waiting' })
}

// GET: Check lobby status or list lobby entries (for creator)
export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const roomCode = searchParams.get('roomCode')
  const action = searchParams.get('action') // 'check' or 'list'

  if (!roomCode) {
    return NextResponse.json({ error: 'Room code required' }, { status: 400 })
  }

  const { data: room } = await supabase
    .from('rooms')
    .select('id, creator_id')
    .eq('room_code', roomCode)
    .single()

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  // Creator listing all lobby entries
  if (action === 'list' && room.creator_id === user.id) {
    const { data: entries } = await supabase
      .from('lobby')
      .select('id, user_id, display_name, status, created_at')
      .eq('room_id', room.id)
      .eq('status', 'waiting')
      .order('created_at', { ascending: true })

    return NextResponse.json({ entries: entries || [] })
  }

  // User checking their own status
  const { data: entry } = await supabase
    .from('lobby')
    .select('status')
    .eq('room_id', room.id)
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ status: entry?.status || 'unknown' })
}

// PATCH: Admit or reject a lobby entry (creator only)
export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { roomCode?: string; userId?: string; action?: 'admit' | 'reject' }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { roomCode, userId, action } = body
  if (!roomCode || !userId || !action) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data: room } = await supabase
    .from('rooms')
    .select('id, creator_id')
    .eq('room_code', roomCode)
    .single()

  if (!room || room.creator_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const newStatus = action === 'admit' ? 'admitted' : 'rejected'

  await supabase
    .from('lobby')
    .update({ status: newStatus })
    .eq('room_id', room.id)
    .eq('user_id', userId)

  return NextResponse.json({ success: true })
}
