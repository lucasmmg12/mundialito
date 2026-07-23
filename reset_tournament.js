import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function resetTournament() {
  console.log('=== RESET COMPLETO DEL TORNEO ===\n');

  // 1. Delete all matches (cascades to match_events and prode_predictions)
  const { data: matches } = await supabase.from('matches').select('id');
  console.log(`Partidos encontrados: ${matches?.length || 0}`);
  
  if (matches && matches.length > 0) {
    const { error } = await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) console.error('Error eliminando partidos:', error.message);
    else console.log('✅ Todos los partidos eliminados (+ match_events y prode_predictions en cascada)');
  }

  // 2. Reset player stats to 0
  const { data: players } = await supabase.from('players').select('id');
  console.log(`\nJugadores encontrados: ${players?.length || 0}`);

  if (players && players.length > 0) {
    const { error } = await supabase.from('players').update({
      goals: 0,
      assists: 0,
      yellow_cards: 0,
      red_cards: 0,
      fouls_committed: 0,
      mvp_awards: 0,
      games_played: 0
    }).neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) console.error('Error reseteando stats:', error.message);
    else console.log('✅ Stats de jugadores reseteadas a 0');
  }

  // 3. Verify
  const { data: remaining } = await supabase.from('matches').select('id');
  console.log(`\n=== VERIFICACIÓN ===`);
  console.log(`Partidos restantes: ${remaining?.length || 0}`);
  console.log('Reset completo. ¡Listo para comenzar de nuevo! 🏆');
}

resetTournament();
