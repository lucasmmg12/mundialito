import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function runTests() {
  console.log("=== INICIANDO TESTS DE PRODE ===");

  // 1. Fetch any profile
  const { data: profiles, error: profError } = await supabase.from('profiles').select('*').limit(2);
  if (profError) {
    console.error("❌ Error fetching profiles:", profError.message);
  }
  
  if (!profiles || profiles.length === 0) {
    console.log("⚠️ No hay perfiles para probar. Creando uno de prueba o abortando.");
    // No profiles means users haven't signed up yet. 
    // We can't insert a profile without an auth.users id because of the foreign key constraint.
    console.log("No auth users exist. Please sign up a user in the frontend first.");
    return;
  }
  
  const user1 = profiles[0].id;

  // 2. Insert a pending match
  const { data: teams } = await supabase.from('teams').select('*').limit(2);
  if (!teams || teams.length < 2) return;

  console.log("\n--- Probando Trigger de Prode ---");
  const { data: newMatch, error: matchInsertError } = await supabase.from('matches').insert([
    { home_team_id: teams[0].id, away_team_id: teams[1].id, status: 'pending', match_date: new Date().toISOString() }
  ]).select().single();

  if (matchInsertError) {
    console.error("❌ Error insertando partido:", matchInsertError.message);
    return;
  }
  console.log("✅ Insert pending match OK. ID:", newMatch.id);

  // 3. Insert a prediction (predicting 2-1 for home)
  const { data: prediction, error: predInsertError } = await supabase.from('prode_predictions').insert([
    { user_id: user1, match_id: newMatch.id, home_goals: 2, away_goals: 1 }
  ]).select().single();

  if (predInsertError) {
    console.error("❌ Error insertando prediccion:", predInsertError.message);
    // Cleanup
    await supabase.from('matches').delete().eq('id', newMatch.id);
    return;
  }
  console.log("✅ Insert prediction OK. ID:", prediction.id);

  const initialPoints = profiles[0].total_points || 0;
  console.log("Puntos iniciales del usuario:", initialPoints);

  // 4. Update match result to exactly match the prediction (2-1)
  console.log("Actualizando resultado del partido a 2-1 (acierto exacto)...");
  await supabase.from('matches').update({ home_goals: 2, away_goals: 1, status: 'completed' }).eq('id', newMatch.id);

  // Check prediction points
  let { data: updatedPred } = await supabase.from('prode_predictions').select('points_awarded').eq('id', prediction.id).single();
  let { data: updatedProf } = await supabase.from('profiles').select('total_points').eq('id', user1).single();

  console.log(`Puntos en prediccion: ${updatedPred?.points_awarded} (Esperado: 3)`);
  console.log(`Puntos totales usuario: ${updatedProf?.total_points} (Esperado: ${initialPoints + 3})`);

  // 5. Update match result to 3-1 (acierto parcial, gana home)
  console.log("Actualizando resultado del partido a 3-1 (acierto parcial)...");
  await supabase.from('matches').update({ home_goals: 3, away_goals: 1, status: 'completed' }).eq('id', newMatch.id);

  updatedPred = (await supabase.from('prode_predictions').select('points_awarded').eq('id', prediction.id).single()).data;
  updatedProf = (await supabase.from('profiles').select('total_points').eq('id', user1).single()).data;

  console.log(`Puntos en prediccion: ${updatedPred?.points_awarded} (Esperado: 1)`);
  console.log(`Puntos totales usuario: ${updatedProf?.total_points} (Esperado: ${initialPoints + 1})`);

  // Cleanup
  console.log("Limpiando datos de prueba...");
  await supabase.from('matches').delete().eq('id', newMatch.id);
  // the prediction is CASCADE deleted when the match is deleted.

  console.log("\n=== TESTS DE PRODE FINALIZADOS ===");
}

runTests();
