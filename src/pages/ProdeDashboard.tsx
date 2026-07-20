import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { calculateMatchProbability } from '../lib/probability';
import { Trophy, AlertCircle, CheckCircle, BarChart3, Medal } from 'lucide-react';
import { Match, Team } from '../lib/mundialito-service';

export const ProdeDashboard = () => {
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<(Match & { home_team: Team; away_team: Team })[]>([]);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Record<string, { home: number; away: number; saved: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      navigate('/prode/auth');
      return;
    }
    fetchData();
  }, [session, navigate]);

  const fetchData = async () => {
    try {
      // Fetch all matches for probability calculation
      const { data: allM } = await supabase.from('matches').select('*').neq('status', 'scheduled');
      if (allM) setAllMatches(allM);

      // Fetch scheduled matches
      const { data: scheduled } = await supabase
        .from('matches')
        .select('*, home_team:home_team_id(*), away_team:away_team_id(*)')
        .eq('status', 'scheduled')
        .order('match_date', { ascending: true });

      if (scheduled) setMatches(scheduled);

      // Fetch user's existing predictions
      if (user) {
        const { data: userPreds } = await supabase
          .from('prode_predictions')
          .select('*')
          .eq('user_id', user.id);

        if (userPreds) {
          const predsMap: any = {};
          userPreds.forEach(p => {
            predsMap[p.match_id] = { home: p.home_goals, away: p.away_goals, saved: true };
          });
          setPredictions(predsMap);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePredictionChange = (matchId: string, type: 'home' | 'away', value: string) => {
    const num = parseInt(value);
    if (isNaN(num) && value !== '') return;
    
    setPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [type]: value === '' ? '' : num,
        saved: false
      }
    }));
  };

  const savePrediction = async (matchId: string) => {
    if (!user) return;
    const pred = predictions[matchId];
    if (pred.home === undefined || pred.away === undefined || pred.home === null || pred.away === null || pred.home.toString() === '' || pred.away.toString() === '') {
        alert("Completa ambos goles");
        return;
    }

    setSaving(matchId);
    try {
      const { error } = await supabase
        .from('prode_predictions')
        .upsert({
          user_id: user.id,
          match_id: matchId,
          home_goals: pred.home,
          away_goals: pred.away
        }, { onConflict: 'user_id,match_id' });

      if (error) throw error;
      
      setPredictions(prev => ({
        ...prev,
        [matchId]: { ...prev[matchId], saved: true }
      }));
    } catch (err) {
      console.error("Error saving prediction", err);
      alert("Error al guardar pronóstico");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-sanatorio-blue font-bold">Cargando pronósticos...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-condensed font-bold text-sanatorio-blue flex items-center gap-3">
            <Trophy className="w-8 h-8 text-sanatorio-pink" /> 
            Mis Pronósticos
          </h1>
          <p className="text-slate-600 mt-2">Acierta el resultado exacto (3pts) o el ganador (1pt).</p>
        </div>
        <Link to="/prode/ranking" className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-sanatorio-blue font-bold shadow-sm border border-slate-200 hover:border-sanatorio-pink transition-colors">
          <Medal className="w-5 h-5 text-yellow-500" /> Ver Ranking
        </Link>
      </div>

      {matches.length === 0 ? (
        <div className="bg-white/80 p-8 rounded-3xl text-center shadow-sm">
          <p className="text-slate-500 font-bold">No hay partidos programados en este momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map(match => {
            const prob = calculateMatchProbability(match.home_team_id, match.away_team_id, allMatches);
            const pred = predictions[match.id] || { home: '', away: '' };

            return (
              <div key={match.id} className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 items-center">
                
                {/* Info del Partido y Probabilidades */}
                <div className="flex-1 w-full space-y-4">
                  <div className="flex justify-between items-center px-4">
                    <span className="text-xs font-bold text-slate-400">
                      {new Date(match.match_date).toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-bold text-sanatorio-blue bg-blue-50 px-2 py-1 rounded-lg">
                      <BarChart3 className="w-3 h-3" />
                      <span>{prob.homeWin}% | {prob.draw}% | {prob.awayWin}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl">
                    <div className="flex flex-col items-center flex-1 text-center">
                      <img src={match.home_team.logo_url || 'https://via.placeholder.com/50'} className="w-12 h-12 object-contain mb-2" alt="Logo" />
                      <span className="font-bold text-slate-700 text-sm">{match.home_team.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 font-bold text-xl text-slate-400">
                      VS
                    </div>

                    <div className="flex flex-col items-center flex-1 text-center">
                      <img src={match.away_team.logo_url || 'https://via.placeholder.com/50'} className="w-12 h-12 object-contain mb-2" alt="Logo" />
                      <span className="font-bold text-slate-700 text-sm">{match.away_team.name}</span>
                    </div>
                  </div>
                </div>

                {/* Pronóstico Input */}
                <div className="flex items-center gap-4 bg-sanatorio-blue/5 p-4 rounded-2xl md:w-auto w-full justify-center">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={pred.home}
                    onChange={(e) => handlePredictionChange(match.id, 'home', e.target.value)}
                    className="w-16 h-12 text-center text-xl font-bold bg-white border-2 border-slate-200 rounded-xl focus:border-sanatorio-pink focus:ring-0 outline-none"
                    placeholder="-"
                  />
                  <span className="font-bold text-slate-400">-</span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={pred.away}
                    onChange={(e) => handlePredictionChange(match.id, 'away', e.target.value)}
                    className="w-16 h-12 text-center text-xl font-bold bg-white border-2 border-slate-200 rounded-xl focus:border-sanatorio-pink focus:ring-0 outline-none"
                    placeholder="-"
                  />
                  
                  <button
                    onClick={() => savePrediction(match.id)}
                    disabled={saving === match.id || (pred.home === '' || pred.away === '') || pred.saved}
                    className={`ml-2 p-3 rounded-xl transition-all shadow-sm flex items-center justify-center
                      ${pred.saved 
                        ? 'bg-green-100 text-green-600 cursor-default' 
                        : 'bg-sanatorio-blue text-white hover:bg-blue-800 disabled:opacity-50 disabled:bg-slate-300'}`}
                  >
                    {saving === match.id ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : pred.saved ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-bold">Guardar</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
