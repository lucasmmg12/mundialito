import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const teamName = "La Argentinoneta";
const logoUrl = "/laargentinoneta.jpeg";
const players = [
  { full_name: "Ivana Ruiz", dni: "38078102" },
  { full_name: "Teresita Laria", dni: "29760588" },
  { full_name: "Rocio Suarez", dni: "37742539" },
  { full_name: "Baistrocchi Valentina", dni: "32877718" },
  { full_name: "Guerra Mariana", dni: "37531124" },
  { full_name: "Sosa Claudio", dni: "33024994" },
  { full_name: "Sena Nicolas", dni: "36888928" },
  { full_name: "Perez Sixto", dni: "32939971" },
  { full_name: "Martinez Natalia", dni: "35515950" },
  { full_name: "Ocampo Martin", dni: "30092244" }
];

async function seedTeam() {
  console.log(`Creating team: ${teamName}...`);
  
  const { data: teamData, error: teamError } = await supabase
    .from('teams')
    .insert([
      { name: teamName, logo_url: logoUrl, status: 'active', women_count: 6, men_count: 4 }
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
