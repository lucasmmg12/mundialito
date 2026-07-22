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
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-sanatorio-pink transition-colors font-semibold mb-4 bg-white/50 px-4 py-2 rounded-xl w-fit">
        ← Volver al Inicio
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-condensed font-bold text-sanatorio-blue flex items-center gap-3">
            <Medal className="w-8 h-8 text-yellow-500" /> 
            Ranking General
          </h1>
          <p className="text-slate-600 mt-2">Tabla de posiciones del Prode Mundialito</p>
        </div>
        <Link to="/prode" className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl text-sanatorio-blue font-bold shadow-sm border border-slate-200 hover:border-sanatorio-pink transition-colors w-full md:w-auto justify-center">
          <Trophy className="w-5 h-5 text-sanatorio-pink" /> Volver a Mis Pronósticos
        </Link>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-4 px-6 font-bold text-slate-500 w-16 text-center">Pos</th>
              <th className="py-4 px-6 font-bold text-slate-500">Participante</th>
              <th className="py-4 px-6 font-bold text-slate-500">Equipo</th>
              <th className="py-4 px-6 font-bold text-slate-500 text-right">Puntos</th>
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
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                      ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                        index === 1 ? 'bg-slate-200 text-slate-700' : 
                        index === 2 ? 'bg-amber-100 text-amber-700' : 
                        'bg-slate-50 text-slate-500'}`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <img 
                        src={profile.avatar_url || 'https://via.placeholder.com/40'} 
                        alt="Avatar" 
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <span className="font-bold text-slate-700">{profile.full_name || 'Usuario'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {profile.team ? (
                      <div className="flex items-center gap-2">
                        <img 
                          src={profile.team.logo_url || 'https://via.placeholder.com/30'} 
                          alt="Team Logo" 
                          className="w-6 h-6 object-contain"
                        />
                        <span className="text-sm font-semibold text-slate-600">{profile.team.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 italic">Sin equipo</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-sanatorio-blue text-lg">
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
