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

-- Setup Row Level Security (RLS)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Policies for public reading (dashboard and results)
CREATE POLICY "Public profiles are viewable by everyone." ON teams FOR SELECT USING (true);
CREATE POLICY "Public players are viewable by everyone." ON players FOR SELECT USING (true);
CREATE POLICY "Public matches are viewable by everyone." ON matches FOR SELECT USING (true);

-- Policies for public insertion (registration form)
CREATE POLICY "Anyone can insert a team" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert players" ON players FOR INSERT WITH CHECK (true);

-- Policies for admins (Authenticated users) can manage everything
CREATE POLICY "Admins can manage teams" ON teams FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage players" ON players FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage matches" ON matches FOR ALL USING (auth.role() = 'authenticated');
