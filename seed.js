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

const mockTeams = [
  { name: 'Guardia FC', captain_name: 'Dr. López', women_count: 5, men_count: 5, status: 'active', responsible_signature: 'López' },
  { name: 'Los Leones del 4to', captain_name: 'Enf. Martínez', women_count: 4, men_count: 6, status: 'active', responsible_signature: 'Martínez' },
  { name: 'Terapia Intensiva', captain_name: 'Dr. Díaz', women_count: 6, men_count: 4, status: 'active', responsible_signature: 'Díaz' },
  { name: 'Administración', captain_name: 'Lic. Gómez', women_count: 7, men_count: 3, status: 'active', responsible_signature: 'Gómez' },
];

async function seed() {
  console.log('Borrando datos viejos...');
  await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('Insertando equipos...');
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .insert(mockTeams)
    .select();

  if (teamsError) {
    console.error('Error insertando equipos:', teamsError);
    return;
  }

  console.log('Equipos insertados:', teams.length);

  const players = [];
  for (const team of teams) {
    for (let i = 1; i <= 10; i++) {
      players.push({
        team_id: team.id,
        full_name: `Jugador ${i} de ${team.name}`,
        dni: `3${Math.floor(Math.random() * 9000000) + 1000000}`,
      });
    }
  }

  console.log('Insertando jugadores...');
  const { error: playersError } = await supabase.from('players').insert(players);
  if (playersError) {
    console.error('Error insertando jugadores:', playersError);
    return;
  }

  const matches = [
    {
      home_team_id: teams[0].id,
      away_team_id: teams[1].id,
      home_goals: 2,
      away_goals: 1,
      status: 'completed',
      match_date: new Date(Date.now() - 100000000).toISOString()
    },
    {
      home_team_id: teams[2].id,
      away_team_id: teams[3].id,
      home_goals: 0,
      away_goals: 0,
      status: 'completed',
      match_date: new Date(Date.now() - 80000000).toISOString()
    },
    {
      home_team_id: teams[1].id,
      away_team_id: teams[2].id,
      home_goals: 3,
      away_goals: 0,
      status: 'completed',
      match_date: new Date(Date.now() - 50000000).toISOString()
    },
    {
      home_team_id: teams[0].id,
      away_team_id: teams[3].id,
      home_goals: 1,
      away_goals: 1,
      status: 'completed',
      match_date: new Date(Date.now() - 20000000).toISOString()
    }
  ];

  console.log('Insertando partidos...');
  const { error: matchesError } = await supabase.from('matches').insert(matches);
  if (matchesError) {
    console.error('Error insertando partidos:', matchesError);
    return;
  }

  console.log('¡Base de datos populada con éxito con mocks de prueba!');
}

seed();
