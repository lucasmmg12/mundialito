import { useState, useEffect } from 'react';
import { getPlayersByTeam, recordMatchEvent, endMatch } from '../lib/mundialito-service';
import { Goal, Flag, Square, Timer, CheckCircle } from 'lucide-react';

interface Props {
  match: any;
  onEndMatch: () => void;
}

export function LiveMatchPanel({ match, onEndMatch }: Props) {
  const [homePlayers, setHomePlayers] = useState<any[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Local score state (optimistic)
  const [score, setScore] = useState({ home: match.home_goals || 0, away: match.away_goals || 0 });
  const [eventsLog, setEventsLog] = useState<{id: string, action: string, text: string}[]>([]);
  
  // Event action state
  const [pendingAction, setPendingAction] = useState<'goal'|'assist'|'yellow_card'|'red_card'|null>(null);
  const [pendingTeam, setPendingTeam] = useState<'home'|'away'|null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const [home, away] = await Promise.all([
          getPlayersByTeam(match.home_team_id),
          getPlayersByTeam(match.away_team_id)
        ]);
        setHomePlayers(home || []);
        setAwayPlayers(away || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, [match]);

  const handleActionClick = (action: 'goal'|'assist'|'yellow_card'|'red_card', team: 'home'|'away') => {
    setPendingAction(action);
    setPendingTeam(team);
  };

  const confirmAction = async (player: any) => {
    if (!pendingAction || !pendingTeam) return;

    try {
      // Registrar evento
      await recordMatchEvent(match.id, player.id, pendingAction, 0); // min 0 para simplificar
      
      const teamName = pendingTeam === 'home' ? match.home_team.name : match.away_team.name;
      const actionName = pendingAction === 'goal' ? 'Gol' : pendingAction === 'assist' ? 'Asistencia' : pendingAction === 'yellow_card' ? 'Amarilla' : 'Roja';
      
      setEventsLog(prev => [{
        id: Math.random().toString(36).substring(2, 9),
        action: pendingAction,
        text: `${actionName} de ${player.full_name || player.name} (${teamName})`
      }, ...prev]);

      if (pendingAction === 'goal') {
        if (pendingTeam === 'home') setScore(s => ({ ...s, home: s.home + 1 }));
        if (pendingTeam === 'away') setScore(s => ({ ...s, away: s.away + 1 }));
      }
    } catch (err) {
      console.error(err);
      alert('Error al registrar evento');
    } finally {
      setPendingAction(null);
      setPendingTeam(null);
    }
  };

  const handleFinishMatchClick = () => {
    setShowEndConfirm(true);
  };

  const confirmFinishMatch = async () => {
    try {
      await endMatch(match.id);
      onEndMatch();
    } catch (err) {
      console.error(err);
      alert('Error al finalizar el partido');
    } finally {
      setShowEndConfirm(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando plantillas...</div>;

  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
      {/* Header Marcador */}
      <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
        <div className="flex-1 text-right">
          <h3 className="text-xl font-bold truncate">{match.home_team.name}</h3>
        </div>
        <div className="px-8 flex items-center gap-4">
          <span className="text-5xl font-black text-sanatorio-blue">{score.home}</span>
          <span className="text-xl font-black text-slate-500">-</span>
          <span className="text-5xl font-black text-sanatorio-pink">{score.away}</span>
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-xl font-bold truncate">{match.away_team.name}</h3>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        
        {/* Separador Central */}
        <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px bg-slate-200"></div>

        {/* Panel Local */}
        <div className="bg-sanatorio-blue/5 border border-sanatorio-blue/10 rounded-2xl p-4">
          <h4 className="text-center font-bold text-sanatorio-blue mb-4 uppercase tracking-widest text-xs">
            {match.home_team?.name || 'Local'}
          </h4>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => handleActionClick('goal', 'home')} className="bg-white hover:bg-green-50 border border-slate-200 text-green-700 p-2 rounded-xl flex flex-col items-center gap-1 w-[45%] sm:w-20 shadow-sm transition-all active:scale-95">
              <Goal className="w-6 h-6" /> <span className="text-[10px] font-bold uppercase">Gol</span>
            </button>
            <button onClick={() => handleActionClick('assist', 'home')} className="bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 p-2 rounded-xl flex flex-col items-center gap-1 w-[45%] sm:w-20 shadow-sm transition-all active:scale-95">
              <Flag className="w-6 h-6" /> <span className="text-[10px] font-bold uppercase">Asist.</span>
            </button>
            <button onClick={() => handleActionClick('yellow_card', 'home')} className="bg-white hover:bg-yellow-50 border border-slate-200 text-yellow-600 p-2 rounded-xl flex flex-col items-center gap-1 w-[45%] sm:w-20 shadow-sm transition-all active:scale-95">
              <Square className="w-6 h-6 fill-yellow-400" /> <span className="text-[10px] font-bold uppercase">Amarilla</span>
            </button>
            <button onClick={() => handleActionClick('red_card', 'home')} className="bg-white hover:bg-red-50 border border-slate-200 text-red-600 p-2 rounded-xl flex flex-col items-center gap-1 w-[45%] sm:w-20 shadow-sm transition-all active:scale-95">
              <Square className="w-6 h-6 fill-red-500" /> <span className="text-[10px] font-bold uppercase">Roja</span>
            </button>
          </div>
        </div>

        {/* Panel Visitante */}
        <div className="bg-sanatorio-pink/5 border border-sanatorio-pink/10 rounded-2xl p-4">
          <h4 className="text-center font-bold text-sanatorio-pink mb-4 uppercase tracking-widest text-xs">
            {match.away_team?.name || 'Visitante'}
          </h4>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => handleActionClick('goal', 'away')} className="bg-white hover:bg-green-50 border border-slate-200 text-green-700 p-2 rounded-xl flex flex-col items-center gap-1 w-[45%] sm:w-20 shadow-sm transition-all active:scale-95">
              <Goal className="w-6 h-6" /> <span className="text-[10px] font-bold uppercase">Gol</span>
            </button>
            <button onClick={() => handleActionClick('assist', 'away')} className="bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 p-2 rounded-xl flex flex-col items-center gap-1 w-[45%] sm:w-20 shadow-sm transition-all active:scale-95">
              <Flag className="w-6 h-6" /> <span className="text-[10px] font-bold uppercase">Asist.</span>
            </button>
            <button onClick={() => handleActionClick('yellow_card', 'away')} className="bg-white hover:bg-yellow-50 border border-slate-200 text-yellow-600 p-2 rounded-xl flex flex-col items-center gap-1 w-[45%] sm:w-20 shadow-sm transition-all active:scale-95">
              <Square className="w-6 h-6 fill-yellow-400" /> <span className="text-[10px] font-bold uppercase">Amarilla</span>
            </button>
            <button onClick={() => handleActionClick('red_card', 'away')} className="bg-white hover:bg-red-50 border border-slate-200 text-red-600 p-2 rounded-xl flex flex-col items-center gap-1 w-[45%] sm:w-20 shadow-sm transition-all active:scale-95">
              <Square className="w-6 h-6 fill-red-500" /> <span className="text-[10px] font-bold uppercase">Roja</span>
            </button>
          </div>
        </div>
      </div>

      {/* Log de eventos */}
      <div className="bg-slate-50 border-t border-slate-100 p-4 h-64 overflow-y-auto">
        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-widest flex items-center gap-2"><Timer className="w-4 h-4"/> Eventos Recientes</h4>
        <div className="space-y-2">
          {eventsLog.length === 0 ? <p className="text-sm text-slate-400 italic">No hay eventos registrados.</p> : eventsLog.map((log) => {
            const getIcon = (action: string) => {
              switch(action) {
                case 'goal': return <Goal className="w-5 h-5 text-green-600" />;
                case 'assist': return <Flag className="w-5 h-5 text-blue-600" />;
                case 'yellow_card': return <Square className="w-5 h-5 fill-yellow-400 text-yellow-500" />;
                case 'red_card': return <Square className="w-5 h-5 fill-red-500 text-red-600" />;
                default: return <CheckCircle className="w-5 h-5 text-slate-400" />;
              }
            };
            return (
              <div key={log.id} className="text-sm text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="bg-slate-50 p-2 rounded-lg">
                  {getIcon(log.action)}
                </div>
                <span className="font-medium text-[15px]">{log.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 bg-slate-900 flex justify-end">
        <button onClick={handleFinishMatchClick} className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] uppercase tracking-wider text-sm">
          <CheckCircle className="w-5 h-5" /> Finalizar Partido
        </button>
      </div>

      {/* Modal de Selección de Jugador (para la acción pendiente) */}
      {pendingAction && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="bg-sanatorio-blue text-white p-4 font-bold text-lg text-center">
              ¿Quién fue? ({pendingAction})
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {(pendingTeam === 'home' ? homePlayers : awayPlayers).map(player => (
                <button 
                  key={player.id}
                  onClick={() => confirmAction(player)}
                  className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600 text-xs">
                    {player.jersey_number || '?'}
                  </div>
                  <span className="font-semibold text-slate-800">{player.full_name || player.name}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setPendingAction(null)} className="w-full p-4 text-center text-slate-500 font-bold hover:bg-slate-50">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal Confirmación Fin de Partido */}
      {showEndConfirm && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 transform scale-100 animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center space-y-4">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <CheckCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-condensed font-black text-slate-800 uppercase tracking-wide">
                Finalizar Partido
              </h3>
              <p className="text-slate-500 font-medium">
                ¿Estás seguro que deseas terminar este encuentro? Esta acción guardará el resultado oficial y no se podrá deshacer.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 p-6 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => setShowEndConfirm(false)} 
                className="flex-1 py-3 px-4 text-center font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 hover:text-slate-800 transition-all shadow-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmFinishMatch} 
                className="flex-1 py-3 px-4 text-center font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 shadow-md hover:shadow-lg transition-all"
              >
                Sí, Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
