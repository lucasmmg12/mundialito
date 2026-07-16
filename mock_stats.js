import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Use SERVICE_ROLE_KEY to bypass RLS for mocking
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function mockStats() {
  console.log("Generando datos mock de estadísticas...");

  // Fetch all players
  const { data: players, error } = await supabase.from('players').select('*');
  if (error || !players) {
    console.error("Error fetching players:", error);
    return;
  }

  if (players.length === 0) {
    console.log("No hay jugadores en la base de datos para mockear.");
    return;
  }

  for (const player of players) {
    // Randomize stats
    const goals = Math.floor(Math.random() * 8); // 0 to 7 goals
    const assists = Math.floor(Math.random() * 5); // 0 to 4 assists
    const mvps = Math.floor(Math.random() * 3); // 0 to 2 mvps
    const yellow = Math.floor(Math.random() * 3);
    const red = Math.random() > 0.9 ? 1 : 0; // 10% chance of red card

    await supabase.from('players').update({
      goals,
      assists,
      mvp_awards: mvps,
      yellow_cards: yellow,
      red_cards: red
    }).eq('id', player.id);
  }

  console.log(`✅ Estadísticas mockeadas exitosamente para ${players.length} jugadores.`);
}

mockStats();
