import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

async function runMock() {
  console.log("Iniciando mapeo coherente de estadísticas...");
  
  // 1. Reset all player stats to 0
  await supabase.from('players').update({
    goals: 0,
    assists: 0,
    mvp_awards: 0,
    yellow_cards: 0,
    red_cards: 0,
    games_played: 0
  }).neq('id', '00000000-0000-0000-0000-000000000000'); // update all

  // 2. Get all completed matches
  const { data: matches } = await supabase.from('matches').select('*').eq('status', 'completed');
  if (!matches || matches.length === 0) {
    console.log("No hay partidos completados para mapear estadísticas. Crea algunos resultados primero.");
    return;
  }

  // 3. Get all players grouped by team
  const { data: players } = await supabase.from('players').select('*');
  const playersByTeam = {};
  players.forEach(p => {
    if (!playersByTeam[p.team_id]) playersByTeam[p.team_id] = [];
    playersByTeam[p.team_id].push(p);
  });

  // Track updates locally before sending
  const playerUpdates = {};
  const initPlayer = (id) => {
    if(!playerUpdates[id]) playerUpdates[id] = { goals: 0, assists: 0, mvp_awards: 0, yellow_cards: 0, red_cards: 0, games_played: 0 };
  }

  for (const match of matches) {
    const homePlayers = playersByTeam[match.home_team_id] || [];
    const awayPlayers = playersByTeam[match.away_team_id] || [];
    
    // Add games played
    [...homePlayers, ...awayPlayers].forEach(p => {
        initPlayer(p.id);
        playerUpdates[p.id].games_played += 1;
    });

    // Distribute home goals
    let homeGoalsLeft = match.home_goals;
    while(homeGoalsLeft > 0 && homePlayers.length > 0) {
      const scorer = homePlayers[Math.floor(Math.random() * homePlayers.length)];
      initPlayer(scorer.id);
      playerUpdates[scorer.id].goals += 1;
      // 70% chance of an assist
      if (Math.random() > 0.3) {
         const assister = homePlayers[Math.floor(Math.random() * homePlayers.length)];
         if (assister.id !== scorer.id) {
           initPlayer(assister.id);
           playerUpdates[assister.id].assists += 1;
         }
      }
      homeGoalsLeft--;
    }

    // Distribute away goals
    let awayGoalsLeft = match.away_goals;
    while(awayGoalsLeft > 0 && awayPlayers.length > 0) {
      const scorer = awayPlayers[Math.floor(Math.random() * awayPlayers.length)];
      initPlayer(scorer.id);
      playerUpdates[scorer.id].goals += 1;
      if (Math.random() > 0.3) {
         const assister = awayPlayers[Math.floor(Math.random() * awayPlayers.length)];
         if (assister.id !== scorer.id) {
           initPlayer(assister.id);
           playerUpdates[assister.id].assists += 1;
         }
      }
      awayGoalsLeft--;
    }

    // Assign 1 MVP per match
    const allMatchPlayers = [...homePlayers, ...awayPlayers];
    if (allMatchPlayers.length > 0) {
      const mvp = allMatchPlayers[Math.floor(Math.random() * allMatchPlayers.length)];
      initPlayer(mvp.id);
      playerUpdates[mvp.id].mvp_awards += 1;
    }

    // Random cards
    allMatchPlayers.forEach(p => {
        if (Math.random() > 0.85) {
            initPlayer(p.id);
            playerUpdates[p.id].yellow_cards += 1;
        }
    });
  }

  // Update DB
  console.log("Aplicando actualizaciones a la base de datos...");
  let count = 0;
  for (const [id, stats] of Object.entries(playerUpdates)) {
    await supabase.from('players').update(stats).eq('id', id);
    count++;
  }

  console.log(`✅ Estadísticas mapeadas coherentemente para ${count} jugadores según los partidos completados.`);
}

runMock();
