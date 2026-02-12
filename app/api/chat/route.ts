import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET: Fetch messages for a room
export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const roomCode = searchParams.get('roomCode')

  if (!roomCode) {
    return NextResponse.json({ error: 'Room code is required' }, { status: 400 })
  }

  // Get room id
  const { data: room } = await supabase
    .from('rooms')
    .select('id')
    .eq('room_code', roomCode)
    .single()

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('id, content, created_at, user_id, sender_name')
    .eq('room_id', room.id)
    .order('created_at', { ascending: true })
    .limit(200)

  return NextResponse.json({ messages: messages || [] })
}

// POST: Send a message
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { roomCode?: string; content?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { roomCode, content } = body

  if (!roomCode || !content || typeof content !== 'string') {
    return NextResponse.json({ error: 'Room code and message content required' }, { status: 400 })
  }

  // Sanitize and limit
  const cleanContent = content.trim().slice(0, 1000)
  if (!cleanContent) {
    return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
  }

  const { data: room } = await supabase
    .from('rooms')
    .select('id')
    .eq('room_code', roomCode)
    .eq('is_active', true)
    .single()

  if (!room) {
    return NextResponse.json({ error: 'Room not found or inactive' }, { status: 404 })
  }

  const senderName = user.user_metadata?.full_name || user.email || 'Anonymous'

  const { data: message, error: insertError } = await supabase
    .from('messages')
    .insert({
      room_id: room.id,
      user_id: user.id,
      sender_name: senderName,
      content: cleanContent,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ message })
}
