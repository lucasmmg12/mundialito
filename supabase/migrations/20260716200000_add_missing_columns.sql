-- Migration: Add captain_email and missing columns to teams table
-- Adds captain_email and shirt_number to support the admin team management CRUD

-- Add captain_email to teams
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS captain_email TEXT;

-- Add shirt_number to players (if missing)
ALTER TABLE players
ADD COLUMN IF NOT EXISTS shirt_number TEXT;

-- Add gender to players (if missing)
ALTER TABLE players
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'M';

-- Add nickname to players (if missing)
ALTER TABLE players
ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Add photo_url to players (if missing - for player photo upload feature)
ALTER TABLE players
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add management_token to teams (for public team link)
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS management_token UUID DEFAULT gen_random_uuid();
