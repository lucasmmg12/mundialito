import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Medal, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string;
  total_points: number;
  team: {
    name: string;
    logo_url: string;
  };
}

export const ProdeLeaderboard = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // 1. Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          avatar_url,
          team:teams(name, logo_url)
        `);

      if (profilesError) throw profilesError;

      // 2. Fetch all completed matches
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('id, home_goals, away_goals')
        .eq('status', 'completed');

      if (matchesError) throw matchesError;

      // 3. Fetch all predictions
      const { data: predictionsData, error: predictionsError } = await supabase
        .from('prode_predictions')
        .select('user_id, match_id, home_goals, away_goals');

      if (predictionsError) throw predictionsError;

      // 4. Calculate points dynamically
      const matchMap = new Map(matchesData?.map(m => [m.id, m]) || []);
      const userPoints = new Map<string, number>();

      if (predictionsData) {
        predictionsData.forEach(pred => {
          const match = matchMap.get(pred.match_id);
          if (match) {
            let points = 0;
            // Exact match (3 pts)
            if (pred.home_goals === match.home_goals && pred.away_goals === match.away_goals) {
              points = 3;
            } else {
              // Check if guessed the winner or tie (1 pt)
              const actualResult = match.home_goals > match.away_goals ? 'home' : (match.home_goals < match.away_goals ? 'away' : 'tie');
              const predictedResult = pred.home_goals > pred.away_goals ? 'home' : (pred.home_goals < pred.away_goals ? 'away' : 'tie');
              
              if (actualResult === predictedResult) {
                points = 1;
              }
            }
            userPoints.set(pred.user_id, (userPoints.get(pred.user_id) || 0) + points);
          }
        });
      }

      // 5. Merge points into profiles and sort
      const finalProfiles = (profilesData as any[]).map(p => ({
        ...p,
        total_points: userPoints.get(p.id) || 0
      })).sort((a, b) => b.total_points - a.total_points);

      setProfiles(finalProfiles);

    } catch (err) {
      console.error("Error fetching leaderboard", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-sanatorio-blue font-bold">Cargando ranking...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32 px-2 md:px-4 pt-4">
      <Link to="/" className="inline-flex items-center gap-2 text-white hover:text-sanatorio-pink transition-colors font-bold mb-2 bg-slate-900/40 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-xl w-fit shadow-md">
        ← Volver al Inicio
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-xl">
        <div>
          <h1 className="text-3xl md:text-4xl font-condensed font-bold text-white flex items-center gap-3 drop-shadow-lg">
            <Medal className="w-10 h-10 text-yellow-400 drop-shadow-md" /> 
            Ranking General
          </h1>
          <p className="text-white/90 font-medium mt-2 drop-shadow-sm text-sm md:text-base">Tabla de posiciones del Prode Mundialito</p>
        </div>
        <Link to="/prode" className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl text-sanatorio-blue font-bold shadow-lg border border-slate-200 hover:border-sanatorio-pink transition-colors w-full md:w-auto justify-center">
          <Trophy className="w-5 h-5 text-sanatorio-pink" /> Mis Pronósticos
        </Link>
      </div>

      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-slate-100 w-full overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[340px]">
          <thead>
            <tr className="bg-gradient-to-r from-slate-100 to-white border-b border-slate-200">
              <th className="py-4 px-2 md:px-6 font-bold text-slate-500 w-10 md:w-16 text-center text-xs md:text-sm">Pos</th>
              <th className="py-4 px-2 md:px-6 font-bold text-slate-500 text-xs md:text-sm">Participante</th>
              <th className="py-4 px-2 md:px-6 font-bold text-slate-500 text-xs md:text-sm hidden sm:table-cell">Equipo</th>
              <th className="py-4 px-2 md:px-6 font-bold text-slate-500 text-right text-xs md:text-sm">Puntos</th>
            </tr>
          </thead>
          <tbody>
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500 font-bold">
                  Aún no hay participantes en el ranking.
                </td>
              </tr>
            ) : (
              profiles.map((profile, index) => (
                <tr key={profile.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 md:py-4 px-2 md:px-6 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full font-bold text-xs md:text-sm shadow-sm
                      ${index === 0 ? 'bg-yellow-400 text-white scale-110' : 
                        index === 1 ? 'bg-slate-300 text-slate-700' : 
                        index === 2 ? 'bg-amber-600 text-white' : 
                        'bg-slate-50 text-slate-500 border border-slate-200'}`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 md:py-4 px-2 md:px-6">
                    <div className="flex items-center gap-2 md:gap-3">
                      {profile.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Avatar" 
                          className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-slate-200 shrink-0 shadow-sm bg-white"
                        />
                      ) : (
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-slate-200 shrink-0 shadow-sm bg-slate-100 flex items-center justify-center text-lg md:text-xl">
                          👤
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-700 text-sm md:text-base truncate">{profile.full_name || 'Usuario'}</span>
                        {/* Show team name here on mobile only */}
                        <div className="flex items-center gap-1 sm:hidden mt-0.5">
                          {profile.team ? (
                            <>
                              <img src={profile.team.logo_url || 'https://via.placeholder.com/30'} alt="Team" className="w-3 h-3 object-contain shrink-0" />
                              <span className="text-[10px] text-slate-500 truncate">{profile.team.name}</span>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Sin equipo</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 md:py-4 px-2 md:px-6 hidden sm:table-cell">
                    {profile.team ? (
                      <div className="flex items-center gap-2">
                        <img 
                          src={profile.team.logo_url || 'https://via.placeholder.com/30'} 
                          alt="Team Logo" 
                          className="w-5 h-5 md:w-6 md:h-6 object-contain shrink-0 drop-shadow-sm"
                        />
                        <span className="text-xs md:text-sm font-semibold text-slate-600 truncate max-w-[120px] md:max-w-none">{profile.team.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs md:text-sm text-slate-400 italic">Sin equipo</span>
                    )}
                  </td>
                  <td className="py-3 md:py-4 px-2 md:px-6 text-right font-black text-sanatorio-blue text-base md:text-xl">
                    {profile.total_points}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
