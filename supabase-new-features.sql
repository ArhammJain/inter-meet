-- =============================================
-- SQL for new features: lobby, persistent rooms, passwords, waiting rooms
-- Run this in Supabase SQL Editor AFTER your initial schema is set up
-- =============================================

-- 1. Add new columns to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_persistent BOOLEAN DEFAULT FALSE;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS waiting_room_enabled BOOLEAN DEFAULT FALSE;

-- 2. Create lobby table for waiting room feature
CREATE TABLE IF NOT EXISTS lobby (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Anonymous',
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'admitted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- 3. Enable RLS on lobby
ALTER TABLE lobby ENABLE ROW LEVEL SECURITY;

-- Users can insert their own lobby entry
CREATE POLICY "Users can request to join lobby"
  ON lobby FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own lobby status
CREATE POLICY "Users can read own lobby status"
  ON lobby FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Room creators can read all lobby entries for their rooms
CREATE POLICY "Creators can read lobby for their rooms"
  ON lobby FOR SELECT
  TO authenticated
  USING (
    room_id IN (SELECT id FROM rooms WHERE creator_id = auth.uid())
  );

-- Room creators can update lobby entries (admit/reject)
CREATE POLICY "Creators can update lobby for their rooms"
  ON lobby FOR UPDATE
  TO authenticated
  USING (
    room_id IN (SELECT id FROM rooms WHERE creator_id = auth.uid())
  );

-- 4. Enable Realtime on key tables (for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE lobby;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
