import dotenv from 'dotenv';
import pkg from 'pg';
const { Client } = pkg;
dotenv.config();

const client = new Client({ connectionString: process.env.SUPABASE_DB_URL });

async function run() {
  await client.connect();
  console.log('Connected to DB');

  try {
    const query = `
      ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_home_team_id_fkey;
      ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_away_team_id_fkey;
      ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_mvp_player_id_fkey;
      
      ALTER TABLE matches ADD CONSTRAINT matches_home_team_id_fkey FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE CASCADE;
      ALTER TABLE matches ADD CONSTRAINT matches_away_team_id_fkey FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE CASCADE;
      ALTER TABLE matches ADD CONSTRAINT matches_mvp_player_id_fkey FOREIGN KEY (mvp_player_id) REFERENCES players(id) ON DELETE SET NULL;
    `;
    await client.query(query);
    console.log('✅ Constraints updated successfully!');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}
run();
