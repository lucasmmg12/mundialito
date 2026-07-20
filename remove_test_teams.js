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

async function removeTestTeams() {
  console.log("Removing test teams using Service Role Key...");
  
  const { data, error } = await supabase
    .from('teams')
    .delete()
    .in('name', testTeams);
    
  if (error) {
    console.error("Error deleting teams:", error.message);
  } else {
    console.log(`Successfully deleted test teams.`);
  }
}

removeTestTeams();
