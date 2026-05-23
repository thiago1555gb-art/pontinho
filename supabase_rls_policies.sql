-- ====================================================================
-- RUN THIS SCRIPT IN YOUR SUPABASE SQL EDITOR TO ENABLE RLS SECURELY
-- ====================================================================

-- 1. Enable Row Level Security on all tables
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_participants ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "players_select_policy" ON public.players;
DROP POLICY IF EXISTS "players_insert_policy" ON public.players;
DROP POLICY IF EXISTS "players_update_policy" ON public.players;
DROP POLICY IF EXISTS "players_delete_policy" ON public.players;

DROP POLICY IF EXISTS "matches_select_policy" ON public.matches;
DROP POLICY IF EXISTS "matches_insert_policy" ON public.matches;
DROP POLICY IF EXISTS "matches_update_policy" ON public.matches;

DROP POLICY IF EXISTS "participants_select_policy" ON public.match_participants;
DROP POLICY IF EXISTS "participants_insert_policy" ON public.match_participants;
DROP POLICY IF EXISTS "participants_update_policy" ON public.match_participants;

-- 3. Create public policies for 'players' table
CREATE POLICY "players_select_policy" ON public.players
  FOR SELECT USING (true);

CREATE POLICY "players_insert_policy" ON public.players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "players_update_policy" ON public.players
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "players_delete_policy" ON public.players
  FOR DELETE USING (true);

-- 4. Create public policies for 'matches' table
CREATE POLICY "matches_select_policy" ON public.matches
  FOR SELECT USING (true);

CREATE POLICY "matches_insert_policy" ON public.matches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "matches_update_policy" ON public.matches
  FOR UPDATE USING (true) WITH CHECK (true);

-- 5. Create public policies for 'match_participants' table
CREATE POLICY "participants_select_policy" ON public.match_participants
  FOR SELECT USING (true);

CREATE POLICY "participants_insert_policy" ON public.match_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "participants_update_policy" ON public.match_participants
  FOR UPDATE USING (true) WITH CHECK (true);