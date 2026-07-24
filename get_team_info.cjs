const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('*')
    .ilike('name', '%minuto%');

  if (teamsError) {
    console.error('Error fetching teams:', teamsError);
    return;
  }

  console.log('Teams:', teams);

  if (teams && teams.length > 0) {
    const teamId = teams[0].id;
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*, home_team:home_team_id(name), away_team:away_team_id(name)')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`);

    if (matchesError) {
      console.error('Error fetching matches:', matchesError);
      return;
    }

    console.log('Matches for team:', JSON.stringify(matches, null, 2));
    
    // Let's also fetch the group this team belongs to, and other teams in the same group
    const groupId = teams[0].group_id;
    const { data: groupTeams } = await supabase.from('teams').select('*').eq('group_id', groupId);
    console.log('Teams in the same group:', groupTeams);
    
    // Fetch group details
    const { data: group } = await supabase.from('groups').select('*').eq('id', groupId);
    console.log('Group Details:', group);
  }
}

run();
