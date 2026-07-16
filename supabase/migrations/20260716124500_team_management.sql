-- Migration: Team Management
-- Adds management_token to teams, photo_url to players, and creates the player_photos storage bucket.

-- 1. Add management_token to teams
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS management_token UUID DEFAULT gen_random_uuid();

-- 2. Add photo_url to players
ALTER TABLE players
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 3. Create Storage Bucket for player photos (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('player_photos', 'player_photos', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage Policies for player_photos (Public read and insert for anyone, since we rely on token for UI access)
CREATE POLICY "Public read player photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'player_photos');

CREATE POLICY "Public insert player photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'player_photos');
  
CREATE POLICY "Public update player photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'player_photos');
