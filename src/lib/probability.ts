export interface TeamStats {
  id: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  form: ('W' | 'D' | 'L')[]; // Last 5 matches
}

interface MatchResult {
  home_team_id: string;
  away_team_id: string;
  home_goals: number;
  away_goals: number;
}

/**
 * Recalculates team statistics based on an array of completed matches.
 */
export const calculateTeamsStats = (matches: MatchResult[]): Record<string, TeamStats> => {
  const stats: Record<string, TeamStats> = {};

  const initTeam = (id: string) => {
    if (!stats[id]) {
      stats[id] = {
        id,
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsScored: 0,
        goalsConceded: 0,
        form: [],
      };
    }
  };

  for (const match of matches) {
    if (match.home_team_id && match.away_team_id) {
      initTeam(match.home_team_id);
      initTeam(match.away_team_id);

      const home = stats[match.home_team_id];
      const away = stats[match.away_team_id];

      home.matchesPlayed++;
      away.matchesPlayed++;
      home.goalsScored += match.home_goals;
      home.goalsConceded += match.away_goals;
      away.goalsScored += match.away_goals;
      away.goalsConceded += match.home_goals;

      if (match.home_goals > match.away_goals) {
        home.wins++;
        away.losses++;
        home.form.push('W');
        away.form.push('L');
      } else if (match.home_goals < match.away_goals) {
        home.losses++;
        away.wins++;
        home.form.push('L');
        away.form.push('W');
      } else {
        home.draws++;
        away.draws++;
        home.form.push('D');
        away.form.push('D');
      }
      
      // Keep only last 5
      if (home.form.length > 5) home.form.shift();
      if (away.form.length > 5) away.form.shift();
    }
  }

  return stats;
};

/**
 * Calculates win probabilities for a given matchup based on historical stats.
 * Uses a simplified algorithm taking into account win rate and goal difference.
 */
export const calculateMatchProbability = (
  homeTeamId: string, 
  awayTeamId: string, 
  allMatches: MatchResult[]
) => {
  const stats = calculateTeamsStats(allMatches);
  
  const home = stats[homeTeamId];
  const away = stats[awayTeamId];

  // Base probabilities (if no history)
  if (!home || !away || (home.matchesPlayed === 0 && away.matchesPlayed === 0)) {
    return { homeWin: 40, draw: 20, awayWin: 40 };
  }

  const getTeamStrength = (team: TeamStats) => {
    if (team.matchesPlayed === 0) return 1; // Base strength
    const winRate = team.wins / team.matchesPlayed;
    const drawRate = team.draws / team.matchesPlayed;
    const avgGoalsScored = team.goalsScored / team.matchesPlayed;
    const avgGoalsConceded = team.goalsConceded / team.matchesPlayed;
    
    // Recent form weight
    let formScore = 0;
    if (team.form.length > 0) {
      formScore = team.form.reduce((acc, result) => {
        if (result === 'W') return acc + 1;
        if (result === 'D') return acc + 0.5;
        return acc;
      }, 0) / team.form.length;
    } else {
      formScore = 0.5; // neutral
    }

    // Combine factors (weighted)
    return (winRate * 0.4) + (drawRate * 0.1) + ((avgGoalsScored / (avgGoalsScored + avgGoalsConceded || 1)) * 0.3) + (formScore * 0.2);
  };

  const homeStrength = home ? getTeamStrength(home) : 1;
  const awayStrength = away ? getTeamStrength(away) : 1;

  // Add small home advantage (even in generic tournaments, there's usually a slight psychological edge or just to break perfect ties)
  const homeAdvantage = 1.05; 
  const adjustedHomeStrength = homeStrength * homeAdvantage;

  const totalStrength = adjustedHomeStrength + awayStrength;
  
  // Base draw probability decreases slightly when teams are very different in strength
  const strengthDiff = Math.abs(adjustedHomeStrength - awayStrength);
  const drawProbRaw = Math.max(0.05, 0.25 - (strengthDiff * 0.2)); // between 5% and 25%

  const remainingProb = 1 - drawProbRaw;
  
  const homeWinProbRaw = (adjustedHomeStrength / totalStrength) * remainingProb;
  const awayWinProbRaw = (awayStrength / totalStrength) * remainingProb;

  return {
    homeWin: Math.round(homeWinProbRaw * 100),
    draw: Math.round(drawProbRaw * 100),
    awayWin: Math.round(awayWinProbRaw * 100)
  };
};
