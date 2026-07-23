import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createFixture() {
  console.log('Obteniendo equipos...');
  const { data: teams, error: teamsError } = await supabase.from('teams').select('*').order('name');
  if (teamsError) {
    console.error(teamsError);
    return;
  }

  if (teams.length !== 11) {
    console.error(`Se esperaban 11 equipos, pero hay ${teams.length}`);
    return;
  }

  console.log('Borrando partidos anteriores...');
  await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Mezclar los equipos aleatoriamente
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

  const groupA = shuffledTeams.slice(0, 5);
  const groupB = shuffledTeams.slice(5, 11);

  console.log('Grupo A (5 equipos):', groupA.map(t => t.name).join(', '));
  console.log('Grupo B (6 equipos):', groupB.map(t => t.name).join(', '));

  const matchesToInsert = [];
  const matchDate = '2026-07-25T12:00:00Z'; // Hora ficticia, en frontend la ocultaremos

  // Fixture Grupo A (Todos contra todos = 6 partidos)
  for (let i = 0; i < groupA.length; i++) {
    for (let j = i + 1; j < groupA.length; j++) {
      matchesToInsert.push({
        home_team_id: groupA[i].id,
        away_team_id: groupA[j].id,
        status: 'scheduled',
        match_date: matchDate,
        notes: 'Grupo A'
      });
    }
  }

  // Fixture Grupo B (Todos contra todos = 10 partidos)
  for (let i = 0; i < groupB.length; i++) {
    for (let j = i + 1; j < groupB.length; j++) {
      matchesToInsert.push({
        home_team_id: groupB[i].id,
        away_team_id: groupB[j].id,
        status: 'scheduled',
        match_date: matchDate,
        notes: 'Grupo B'
      });
    }
  }

  console.log(`Insertando ${matchesToInsert.length} partidos...`);
  const { error: insertError } = await supabase.from('matches').insert(matchesToInsert);
  
  if (insertError) {
    console.error('Error insertando fixture:', insertError);
  } else {
    console.log('Fixture creado exitosamente.');
  }
}

createFixture();
