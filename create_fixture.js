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

  // Función para generar fixture Round-Robin
  function generateRounds(groupTeams) {
    let localTeams = [...groupTeams];
    if (localTeams.length % 2 !== 0) {
      localTeams.push(null); // 'null' es el equipo comodín (fecha libre)
    }

    let numRounds = localTeams.length - 1;
    let matchesPerRound = localTeams.length / 2;
    let rounds = [];

    for (let round = 0; round < numRounds; round++) {
      let currentRound = [];
      for (let match = 0; match < matchesPerRound; match++) {
        let home = localTeams[match];
        let away = localTeams[localTeams.length - 1 - match];
        
        if (home !== null && away !== null) {
          // Alternar localía basada en si es ronda par o impar para el equipo fijo
          if (match === 0 && round % 2 !== 0) {
            currentRound.push({ home: away, away: home });
          } else {
            currentRound.push({ home, away });
          }
        }
      }
      rounds.push(currentRound);
      
      // Rotar equipos (mantener el primero fijo)
      let fixed = localTeams.shift();
      let last = localTeams.pop();
      localTeams.unshift(last);
      localTeams.unshift(fixed);
    }
    return rounds;
  }

  const roundsA = generateRounds(groupA);
  const roundsB = generateRounds(groupB);

  const flatMatchesA = roundsA.flat();
  const flatMatchesB = roundsB.flat();

  let aIndex = 0;
  let bIndex = 0;

  // Intercalar partidos 1 de A, 1 de B
  while (aIndex < flatMatchesA.length || bIndex < flatMatchesB.length) {
    if (aIndex < flatMatchesA.length) {
      const match = flatMatchesA[aIndex];
      matchesToInsert.push({
        home_team_id: match.home.id,
        away_team_id: match.away.id,
        status: 'scheduled',
        match_date: matchDate, // Hora ficticia
        notes: 'Grupo A'
      });
      aIndex++;
    }
    if (bIndex < flatMatchesB.length) {
      const match = flatMatchesB[bIndex];
      matchesToInsert.push({
        home_team_id: match.home.id,
        away_team_id: match.away.id,
        status: 'scheduled',
        match_date: matchDate, // Hora ficticia
        notes: 'Grupo B'
      });
      bIndex++;
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
