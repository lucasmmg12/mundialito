import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function countTeams() {
  const { data: teams, error } = await supabase
    .from('teams')
    .select('name');
    
  if (error) {
    console.error("Error fetching teams:", error.message);
    return;
  }
  
  console.log(`\nTotal number of teams: ${teams.length}`);
  console.log("Teams list:");
  teams.forEach((team, index) => {
    console.log(`${index + 1}. ${team.name}`);
  });
}

countTeams();
