import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const teamName = "Real Manyin";
const players = [
  { full_name: "Lucas Silva" },
  { full_name: "Luciano Algarilla" },
  { full_name: "Enzo Colomer" },
  { full_name: "Florencia Muñoz" },
  { full_name: "Luciana Carrizo" },
  { full_name: "Guadalupe Lorea" },
  { full_name: "Anahí Flores" },
  { full_name: "Germán Peze" },
  { full_name: "Brenda Morales" }
];

async function seedTeam() {
  console.log(`Creating team: ${teamName}...`);
  
  const { data: teamData, error: teamError } = await supabase
    .from('teams')
    .insert([
      { 
        name: teamName, 
        status: 'active', 
        women_count: 5, 
        men_count: 4 
      }
    ])
    .select()
    .single();
    
  if (teamError) {
    console.error("Error creating team:", teamError.message);
    return;
  }
  
  const teamId = teamData.id;
  console.log(`Team created successfully with ID: ${teamId}`);
  
  console.log("Adding players...");
  const playersToInsert = players.map(player => ({
    team_id: teamId,
    full_name: player.full_name
  }));
  
  const { error: playersError } = await supabase
    .from('players')
    .insert(playersToInsert);
    
  if (playersError) {
    console.error("Error adding players:", playersError.message);
  } else {
    console.log("Players added successfully!");
  }
}

seedTeam();
