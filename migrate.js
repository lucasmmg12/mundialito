import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error("Missing SUPABASE_DB_URL in .env");
  process.exit(1);
}

const client = new Client({
  connectionString,
});

const migrationSQL = `
  -- Create teams table
  CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    captain_name TEXT,
    women_count INTEGER DEFAULT 0,
    men_count INTEGER DEFAULT 0,
    logo_url TEXT,
    status TEXT DEFAULT 'pending', -- pending, active, inactive
    responsible_signature TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );

  -- Create players table
  CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    dni TEXT,
    jersey_number INTEGER,
    position TEXT,
    games_played INTEGER DEFAULT 0,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    fouls_committed INTEGER DEFAULT 0,
    mvp_awards INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );

  -- Create matches table
  CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_date TIMESTAMP WITH TIME ZONE,
    home_team_id UUID REFERENCES teams(id),
    away_team_id UUID REFERENCES teams(id),
    home_goals INTEGER DEFAULT 0,
    away_goals INTEGER DEFAULT 0,
    status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed
    mvp_player_id UUID REFERENCES players(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );

  -- Create match events for detailed stats (goals, cards per match per player)
  CREATE TABLE IF NOT EXISTS match_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- goal, assist, yellow_card, red_card, foul
    minute INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );
`;

async function runMigration() {
  try {
    await client.connect();
    console.log("Connected to Supabase DB. Running migrations...");
    await client.query(migrationSQL);
    console.log("Migrations executed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.end();
  }
}

runMigration();
