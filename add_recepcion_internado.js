import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const teamName = "Recepción de Internado";
const logoUrl = "/lsa.jpg";
const players = [
  { full_name: "Johana Marín", dni: "34194741" },
  { full_name: "Ayelén Jofré", dni: "42386579" },
  { full_name: "Eliana Ortiz", dni: "34920562" },
  { full_name: "Marlene Guardia", dni: "37531423" },
  { full_name: "Flores Eduardo", dni: "26287450" },
  { full_name: "Fernanda Camacho", dni: "42249973" },
  { full_name: "Gil Paula", dni: "41909159" },
  { full_name: "Benítez Juan", dni: "27674133" },
  { full_name: "Giménez Pablo", dni: "35270259" }
];

async function seedTeam() {
  console.log(`Creating team: ${teamName}...`);
  
  const { data: teamData, error: teamError } = await supabase
    .from('teams')
    .insert([
      { 
        name: teamName, 
        logo_url: logoUrl,
        status: 'active', 
        women_count: 7, 
        men_count: 5 
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
    full_name: player.full_name,
    dni: player.dni
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
