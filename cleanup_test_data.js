import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const testTeams = [
  "Guardia FC",
  "Los Leones del 4to",
  "Terapia Intensiva",
  "Administración"
];

async function cleanup() {
  console.log("Starting cleanup of test teams...");

  // 1. Get the IDs of the test teams
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, name')
    .in('name', testTeams);

  if (teamsError || !teams || teams.length === 0) {
    console.error("Error fetching test teams or none found:", teamsError?.message);
    return;
  }

  const teamIds = teams.map(t => t.id);
  console.log(`Found ${teamIds.length} test teams to delete.`);

  // 2. Delete matches involving these teams
  const { error: matchesError } = await supabase
    .from('matches')
    .delete()
    .or(`home_team_id.in.(${teamIds.join(',')}),away_team_id.in.(${teamIds.join(',')})`);

  if (matchesError) {
    console.error("Error deleting matches:", matchesError.message);
    return;
  }
  console.log("Deleted related matches.");

  // 3. Delete the teams
  const { error: deleteTeamsError } = await supabase
    .from('teams')
    .delete()
    .in('id', teamIds);

  if (deleteTeamsError) {
    console.error("Error deleting test teams:", deleteTeamsError.message);
    return;
  }
  console.log("Deleted test teams successfully.");
}

cleanup();
