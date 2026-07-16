import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function runTests() {
  console.log("=== INICIANDO TESTS DE BASE DE DATOS ===");

  // 1. Test fetching teams
  const { data: teams, error: teamsError } = await supabase.from('teams').select('*').limit(2);
  if (teamsError) {
    console.error("❌ Error fetching teams:", teamsError.message);
    return;
  }
  console.log("✅ Fetch teams OK. Encontrados:", teams?.length);
  
  if (!teams || teams.length === 0) {
      console.log("No hay equipos para probar el resto de operaciones. Abortando test.");
      return;
  }
  const teamId = teams[0].id;

  // 2. Test inserting a player
  console.log("\n--- Probando CRUD de Jugadores ---");
  const { data: newPlayer, error: insertError } = await supabase.from('players').insert([
    { team_id: teamId, full_name: 'Test Player', dni: '12345678', gender: 'M', nickname: 'Tester' }
  ]).select().single();
  
  if (insertError) {
    console.error("❌ Error insertando jugador:", insertError.message);
  } else {
    console.log("✅ Insert player OK. ID:", newPlayer.id);

    // 3. Test updating a player
    const { error: updateError } = await supabase.from('players').update({ nickname: 'Test Updated' }).eq('id', newPlayer.id);
    if (updateError) {
      console.error("❌ Error actualizando jugador:", updateError.message);
    } else {
      console.log("✅ Update player OK.");
    }

    // 4. Test deleting a player
    const { error: deleteError } = await supabase.from('players').delete().eq('id', newPlayer.id);
    if (deleteError) {
      console.error("❌ Error eliminando jugador:", deleteError.message);
    } else {
      console.log("✅ Delete player OK.");
    }
  }

  // 5. Test matches table
  console.log("\n--- Probando Tabla de Partidos (Fixture) ---");
  if (teams.length >= 2) {
    const { data: newMatch, error: matchInsertError } = await supabase.from('matches').insert([
      { home_team_id: teams[0].id, away_team_id: teams[1].id, status: 'pending', match_date: new Date().toISOString() }
    ]).select().single();

    if (matchInsertError) {
      console.error("❌ Error insertando partido:", matchInsertError.message);
    } else {
      console.log("✅ Insert pending match OK. ID:", newMatch.id);

      const { error: matchUpdateError } = await supabase.from('matches').update({ home_goals: 1, away_goals: 0, status: 'completed' }).eq('id', newMatch.id);
      if (matchUpdateError) {
         console.error("❌ Error actualizando partido:", matchUpdateError.message);
      } else {
         console.log("✅ Update match result OK.");
      }

      const { error: matchDeleteError } = await supabase.from('matches').delete().eq('id', newMatch.id);
      if (matchDeleteError) {
         console.error("❌ Error eliminando partido de prueba:", matchDeleteError.message);
      } else {
         console.log("✅ Delete match OK.");
      }
    }
  } else {
    console.log("⚠️ No hay suficientes equipos para probar partidos (necesitan 2).");
  }

  console.log("\n=== TESTS FINALIZADOS ===");
}

runTests();
