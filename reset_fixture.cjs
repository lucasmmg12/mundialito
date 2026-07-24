const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function resetFixture() {
  console.log('Reiniciando todos los partidos...');
  
  // Borrar todos los eventos de partidos (goles, tarjetas, asistencias)
  const { error: eventsError } = await supabase
    .from('match_events')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (eventsError) {
    console.error('Error al borrar eventos:', eventsError);
  } else {
    console.log('Eventos de partidos eliminados.');
  }

  // Resetear los partidos a pendientes y 0-0
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .update({
      status: 'pending',
      home_goals: 0,
      away_goals: 0,
      mvp_player_id: null
    })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

  if (matchesError) {
    console.error('Error al resetear partidos:', matchesError);
  } else {
    console.log('Todos los partidos fueron reiniciados a pendientes y con marcador 0-0.');
  }
}

resetFixture();
