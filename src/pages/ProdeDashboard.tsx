import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { calculateMatchProbability } from '../lib/probability';
import { Trophy, CheckCircle, BarChart3, Medal, X, Loader2, Lock } from 'lucide-react';
import type { Match, Team } from '../lib/mundialito-service';

type MatchWithTeams = Match & { home_team: Team; away_team: Team };

export const ProdeDashboard = () => {
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchWithTeams[]>([]);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Record<string, { home: number; away: number; saved: boolean }>>({});
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [activeMatch, setActiveMatch] = useState<MatchWithTeams | null>(null);
  const [modalHome, setModalHome] = useState('');
  const [modalAway, setModalAway] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!session) {
      navigate('/prode/auth');
      return;
    }
    fetchData();
  }, [session, navigate]);

  const fetchData = async () => {
    try {
      const { data: fetchedMatches } = await supabase
        .from('matches')
        .select('*, home_team:home_team_id(*), away_team:away_team_id(*)')
        .order('match_date', { ascending: true });

      if (fetchedMatches) {
        setAllMatches(fetchedMatches);
        setMatches(fetchedMatches);
      }

      if (user) {
        const { data: userPreds } = await supabase
          .from('prode_predictions')
          .select('*')
          .eq('user_id', user.id);

        if (userPreds) {
          const predsMap: Record<string, { home: number; away: number; saved: boolean }> = {};
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

  const openModal = (match: MatchWithTeams) => {
    const existing = predictions[match.id];
    setActiveMatch(match);
    setModalHome(existing ? existing.home.toString() : '');
    setModalAway(existing ? existing.away.toString() : '');
    setSaveError('');
  };

  const closeModal = () => {
    setActiveMatch(null);
    setModalHome('');
    setModalAway('');
    setSaveError('');
  };

  const savePrediction = async () => {
    if (!user || !activeMatch) return;
    
    const homeGoals = parseInt(modalHome);
    const awayGoals = parseInt(modalAway);

    if (isNaN(homeGoals) || isNaN(awayGoals) || homeGoals < 0 || awayGoals < 0) {
      setSaveError('Ingresa goles válidos para ambos equipos.');
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      // Check if prediction already exists
      const existingPred = predictions[activeMatch.id];

      if (existingPred?.saved) {
        setSaveError('Ya cargaste tu pronóstico para este partido. No se puede modificar.');
        setSaving(false);
        return;
      }

      // Try insert first (most common case for new predictions)
      const { error: insertError } = await supabase
        .from('prode_predictions')
        .insert({
          user_id: user.id,
          match_id: activeMatch.id,
          home_goals: homeGoals,
          away_goals: awayGoals
        });

      if (insertError) {
        // If unique constraint violation, the prediction already exists
        if (insertError.code === '23505') {
          setSaveError('Ya existe un pronóstico para este partido.');
        } else {
          console.error('Insert error:', insertError);
          setSaveError(`Error: ${insertError.message}`);
        }
        setSaving(false);
        return;
      }

      // Update local state
      setPredictions(prev => ({
        ...prev,
        [activeMatch.id]: { home: homeGoals, away: awayGoals, saved: true }
      }));

      // Close modal after brief success visual
      setTimeout(() => {
        closeModal();
      }, 600);

    } catch (err: any) {
      console.error('Error saving prediction:', err);
      setSaveError(err.message || 'Error inesperado al guardar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-sanatorio-pink" />
        <span className="text-white font-bold drop-shadow-sm">Cargando pronósticos...</span>
      </div>
    );
  }

  const isAdmin = user?.email === 'lmarinero@sanatorioargentino.com.ar';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-700 hover:text-sanatorio-blue transition-colors font-semibold mb-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl w-fit shadow-sm">
        ← Volver al Inicio
      </Link>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-condensed font-bold text-white flex items-center gap-3 drop-shadow-md">
            <Trophy className="w-8 h-8 text-white drop-shadow-sm" /> 
            Mis Pronósticos
          </h1>
          <p className="text-white/90 font-medium mt-2 drop-shadow-sm text-lg">Acierta el resultado exacto (3pts) o el ganador (1pt).</p>
        </div>
        <Link to="/prode/ranking" className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl text-sanatorio-blue font-bold shadow-sm border border-slate-200 hover:border-sanatorio-pink transition-colors w-full md:w-auto justify-center">
          <Medal className="w-5 h-5 text-yellow-500" /> Ver Ranking General
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
            const pred = predictions[match.id];
            const isCompleted = match.status === 'completed';
            const hasSavedPrediction = pred?.saved === true;
            const canPredict = (match.status === 'scheduled' || match.status === 'pending') && !hasSavedPrediction;

            return (
              <div 
                key={match.id} 
                onClick={() => canPredict || isAdmin ? openModal(match) : null}
                className={`relative bg-white/90 backdrop-blur-sm p-5 sm:p-6 rounded-3xl shadow-sm border transition-all
                  ${isCompleted ? 'border-slate-200 opacity-80' : 'border-sanatorio-blue/20'}
                  ${canPredict ? 'cursor-pointer hover:shadow-lg hover:border-sanatorio-pink/40 hover:scale-[1.01]' : ''}
                `}
              >
                {/* Status Badge */}
                {isCompleted && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                    Finalizado (Real: {match.home_goals} - {match.away_goals})
                  </div>
                )}
                {!isCompleted && match.status === 'in_progress' && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-sanatorio-pink text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm animate-pulse">
                    En Vivo
                  </div>
                )}

                {/* Match info row */}
                <div className="flex justify-between items-center mb-3 px-1">
                  <span className="text-xs font-bold text-slate-400">
                    {new Date(match.match_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-sanatorio-blue bg-blue-50 px-2 py-1 rounded-lg">
                    <BarChart3 className="w-3 h-3" />
                    <span>{prob.homeWin}% | {prob.draw}% | {prob.awayWin}%</span>
                  </div>
                </div>

                {/* Teams + Score row */}
                <div className="flex items-center justify-between gap-2">
                  {/* Home Team */}
                  <div className="flex flex-col items-center flex-1 text-center min-w-0">
                    <img src={match.home_team.logo_url || 'https://via.placeholder.com/50'} className="w-12 h-12 object-contain mb-1.5" alt="Logo" />
                    <span className="font-bold text-slate-700 text-xs sm:text-sm truncate w-full">{match.home_team.name}</span>
                  </div>

                  {/* Prediction / Result center */}
                  <div className="flex items-center gap-3 shrink-0">
                    {hasSavedPrediction ? (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2.5 rounded-2xl">
                        <span className="text-2xl font-black text-green-700">{pred.home}</span>
                        <span className="text-green-400 font-bold">-</span>
                        <span className="text-2xl font-black text-green-700">{pred.away}</span>
                        <CheckCircle className="w-5 h-5 text-green-500 ml-1" />
                      </div>
                    ) : canPredict ? (
                      <div className="flex items-center gap-2 bg-sanatorio-blue/5 border-2 border-dashed border-sanatorio-blue/30 px-4 py-2.5 rounded-2xl">
                        <span className="text-sm font-bold text-sanatorio-blue">Tocar para pronosticar</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-2xl">
                        <Lock className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-400">Bloqueado</span>
                      </div>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center flex-1 text-center min-w-0">
                    <img src={match.away_team.logo_url || 'https://via.placeholder.com/50'} className="w-12 h-12 object-contain mb-1.5" alt="Logo" />
                    <span className="font-bold text-slate-700 text-xs sm:text-sm truncate w-full">{match.away_team.name}</span>
                  </div>
                </div>

                {/* Phase badge */}
                {match.notes && (
                  <div className="mt-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">{match.notes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* PREDICTION MODAL */}
      {activeMatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={closeModal}>
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 fade-in duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-sanatorio-blue to-[#1a4f8f] p-5 relative">
              <button onClick={closeModal} className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-condensed font-bold text-lg text-white uppercase tracking-wider">
                Cargar Pronóstico
              </h3>
              <p className="text-white/70 text-xs mt-1">
                {new Date(activeMatch.match_date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                {activeMatch.notes && ` · ${activeMatch.notes}`}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Teams Row */}
              <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex flex-col items-center flex-1 text-center">
                  <img src={activeMatch.home_team.logo_url || 'https://via.placeholder.com/60'} className="w-16 h-16 object-contain mb-2" alt="Logo" />
                  <span className="font-bold text-slate-800 text-sm">{activeMatch.home_team.name}</span>
                </div>

                <span className="text-slate-300 font-black text-2xl">VS</span>

                <div className="flex flex-col items-center flex-1 text-center">
                  <img src={activeMatch.away_team.logo_url || 'https://via.placeholder.com/60'} className="w-16 h-16 object-contain mb-2" alt="Logo" />
                  <span className="font-bold text-slate-800 text-sm">{activeMatch.away_team.name}</span>
                </div>
              </div>

              {/* Score Inputs */}
              <div className="flex items-center justify-center gap-6 mb-6">
                <div className="flex flex-col items-center">
                  <label className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Local</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={modalHome}
                    onChange={(e) => setModalHome(e.target.value)}
                    disabled={predictions[activeMatch.id]?.saved && !isAdmin}
                    className="w-20 h-16 text-center text-3xl font-black bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-sanatorio-pink focus:ring-2 focus:ring-sanatorio-pink/20 transition-all text-slate-800 disabled:opacity-50"
                    placeholder="0"
                    autoFocus
                  />
                </div>

                <span className="text-3xl font-black text-slate-300 mt-6">-</span>

                <div className="flex flex-col items-center">
                  <label className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Visitante</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={modalAway}
                    onChange={(e) => setModalAway(e.target.value)}
                    disabled={predictions[activeMatch.id]?.saved && !isAdmin}
                    className="w-20 h-16 text-center text-3xl font-black bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-sanatorio-pink focus:ring-2 focus:ring-sanatorio-pink/20 transition-all text-slate-800 disabled:opacity-50"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Probability Bar */}
              {(() => {
                const prob = calculateMatchProbability(activeMatch.home_team_id, activeMatch.away_team_id, allMatches);
                return (
                  <div className="mb-6">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                      <span>Local {prob.homeWin}%</span>
                      <span>Empate {prob.draw}%</span>
                      <span>Visit. {prob.awayWin}%</span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden bg-slate-100">
                      <div className="bg-sanatorio-blue rounded-l-full" style={{ width: `${prob.homeWin}%` }} />
                      <div className="bg-slate-300" style={{ width: `${prob.draw}%` }} />
                      <div className="bg-sanatorio-pink rounded-r-full" style={{ width: `${prob.awayWin}%` }} />
                    </div>
                  </div>
                );
              })()}

              {/* Error message */}
              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-semibold p-3 rounded-xl mb-4">
                  {saveError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                {!(predictions[activeMatch.id]?.saved && !isAdmin) && (
                  <button
                    onClick={savePrediction}
                    disabled={saving || modalHome === '' || modalAway === ''}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-sanatorio-blue hover:bg-blue-800 transition-colors shadow-md disabled:opacity-50 disabled:bg-slate-300 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Confirmar Pronóstico
                      </>
                    )}
                  </button>
                )}
              </div>

              <p className="text-[10px] text-slate-400 text-center mt-4 font-medium">
                ⚠️ Una vez confirmado, no podrás modificar tu pronóstico.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
