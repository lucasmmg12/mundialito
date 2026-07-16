import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Activity, Plus, Save, ArrowLeft, RefreshCw, CheckCircle, Clock, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LiveMatchPanel } from '../../components/LiveMatchPanel';
import { startMatch } from '../../lib/mundialito-service';

export const AdminMatches = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activeLiveMatch, setActiveLiveMatch] = useState<any | null>(null);

  // Form state for single manual match
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [homeGoals, setHomeGoals] = useState('0');
  const [awayGoals, setAwayGoals] = useState('0');
  const [matchDate, setMatchDate] = useState('');

  // Inline edit state for pending fixtures
  const [pendingScores, setPendingScores] = useState<Record<string, { home: string, away: string }>>({});
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch active teams
    const { data: teamsData } = await supabase
      .from('teams')
      .select('*')
      .eq('status', 'active');
      
    if (teamsData) setTeams(teamsData);

    // Fetch matches
    const { data: matchesData } = await supabase
      .from('matches')
      .select('*, home_team:home_team_id(name), away_team:away_team_id(name)')
      .order('match_date', { ascending: false });
      
    if (matchesData) {
      setMatches(matchesData);
      
      // Initialize pending scores state
      const initialScores: Record<string, { home: string, away: string }> = {};
      matchesData.forEach((m: any) => {
        if (m.status === 'pending') {
          initialScores[m.id] = { home: '', away: '' };
        }
      });
      setPendingScores(initialScores);
    }
    
    setLoading(false);
  };

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (homeTeam === awayTeam) {
      alert('Un equipo no puede jugar contra sí mismo.');
      return;
    }

    const { error } = await supabase
      .from('matches')
      .insert([{
        home_team_id: homeTeam,
        away_team_id: awayTeam,
        home_goals: parseInt(homeGoals),
        away_goals: parseInt(awayGoals),
        match_date: new Date(matchDate).toISOString(),
        status: 'completed'
      }]);

    if (error) {
      alert('Error al guardar el partido: ' + error.message);
    } else {
      alert('Partido guardado con éxito.');
      setHomeTeam('');
      setAwayTeam('');
      setHomeGoals('0');
      setAwayGoals('0');
      fetchData();
    }
  };

  const handleGenerateClick = () => {
    if (teams.length < 2) return alert("Se necesitan al menos 2 equipos aprobados.");
    setShowConfirmModal(true);
  };

  const confirmGenerateFixture = async () => {
    setShowConfirmModal(false);
    setGenerating(true);
    let newMatches = [];
    
    // Algoritmo Round Robin simple (Todos vs Todos)
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        // Verificar si este encuentro ya existe (en cualquier orden)
        const exists = matches.some(m => 
          (m.home_team_id === teams[i].id && m.away_team_id === teams[j].id) ||
          (m.home_team_id === teams[j].id && m.away_team_id === teams[i].id)
        );
        
        if (!exists) {
          // Programar fecha ficticia para mañana a las 10am (el admin la puede cambiar luego o ignorarla)
          let date = new Date();
          date.setDate(date.getDate() + 1);
          date.setHours(10, 0, 0, 0);
          
          newMatches.push({
            home_team_id: teams[i].id,
            away_team_id: teams[j].id,
            home_goals: 0, // default
            away_goals: 0, // default
            status: 'pending',
            match_date: date.toISOString()
          });
        }
      }
    }
    
    if (newMatches.length > 0) {
      const { error } = await supabase.from('matches').insert(newMatches);
      if (error) {
        alert("Error al generar fixture: " + error.message);
      } else {
        fetchData();
      }
    } else {
      alert("El fixture ya está completo. Todos los equipos aprobados ya tienen partidos programados entre sí.");
    }
    
    setGenerating(false);
  };

  const updateFixtureResult = async (matchId: string) => {
    const scores = pendingScores[matchId];
    if (scores.home === '' || scores.away === '') {
      return alert("Debe ingresar los goles de ambos equipos.");
    }

    const { error } = await supabase.from('matches').update({
      home_goals: parseInt(scores.home),
      away_goals: parseInt(scores.away),
      status: 'completed'
    }).eq('id', matchId);

    if (error) {
      alert("Error al guardar resultado: " + error.message);
    } else {
      fetchData();
    }
  };

  const handleStartLiveMatch = async (match: any) => {
    try {
      await startMatch(match.id);
      setActiveLiveMatch({ ...match, status: 'in_progress' });
      fetchData(); // Refresh list behind the scenes
    } catch (err) {
      console.error(err);
      alert('Error al iniciar partido');
    }
  };

  if (loading) return <div className="text-center p-10 text-slate-500 font-bold">Cargando datos...</div>;

  const completedMatches = matches.filter(m => m.status === 'completed');
  const pendingMatches = matches.filter(m => m.status === 'pending');
  const inProgressMatches = matches.filter(m => m.status === 'in_progress');

  if (activeLiveMatch) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto px-4 pb-20 mt-4">
         <LiveMatchPanel 
           match={activeLiveMatch} 
           onEndMatch={() => {
             setActiveLiveMatch(null);
             fetchData();
           }} 
         />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 pb-20">
      <Link to="/admin" className="inline-flex items-center gap-2 text-white hover:text-white/80 font-bold transition-colors drop-shadow-md">
        <ArrowLeft className="w-5 h-5" /> Volver al Panel
      </Link>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-3xl font-condensed font-bold text-sanatorio-blue flex items-center gap-3">
          <Activity className="text-sanatorio-pink" /> Gestión de Fixture
        </h2>
        <button 
          onClick={handleGenerateClick}
          disabled={generating}
          className="bg-sanatorio-pink text-white font-bold px-6 py-2.5 rounded-xl shadow-md hover:bg-pink-600 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Generando...' : 'Generar Fixture Automático'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Historial y Fixture */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Partidos Pendientes (Fixture) */}
          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2">
              <Clock className="text-yellow-500" /> Partidos Pendientes
            </h3>
            <div className="space-y-3">
              {inProgressMatches.map(match => (
                <div key={match.id} className="flex flex-col md:flex-row md:justify-between md:items-center p-4 border-2 border-sanatorio-pink bg-pink-50 rounded-xl shadow-sm gap-4 relative overflow-hidden">
                   <div className="absolute top-0 right-0 bg-sanatorio-pink text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase">En Vivo</div>
                   <div className="flex-1 text-center md:text-right font-bold text-slate-800">{match.home_team?.name}</div>
                   <div className="flex items-center justify-center gap-4">
                     <span className="text-2xl font-black text-sanatorio-blue">{match.home_goals || 0}</span>
                     <span className="text-slate-400 font-black">-</span>
                     <span className="text-2xl font-black text-sanatorio-pink">{match.away_goals || 0}</span>
                   </div>
                   <div className="flex-1 text-center md:text-left font-bold text-slate-800">{match.away_team?.name}</div>
                   <button onClick={() => setActiveLiveMatch(match)} className="md:absolute md:left-4 bg-white text-sanatorio-pink border border-sanatorio-pink px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-sanatorio-pink hover:text-white transition-colors">
                     Entrar al Panel
                   </button>
                </div>
              ))}
              
              {pendingMatches.map(match => (
                <div key={match.id} className="flex flex-col md:flex-row md:justify-between md:items-center p-4 border-2 border-dashed border-slate-200 bg-slate-50 rounded-xl hover:border-sanatorio-blue transition-colors gap-4">
                  <div className="flex-1 text-center md:text-right font-bold text-slate-700">{match.home_team?.name}</div>
                  
                  <div className="flex items-center justify-center gap-2">
                    <input 
                      type="number" min="0" 
                      className="w-12 h-10 text-center font-bold text-lg border border-slate-300 rounded-lg focus:ring-2 focus:ring-sanatorio-blue outline-none"
                      value={pendingScores[match.id]?.home ?? ''}
                      onChange={e => setPendingScores({ ...pendingScores, [match.id]: { ...pendingScores[match.id], home: e.target.value } })}
                    />
                    <span className="text-slate-400 font-black">VS</span>
                    <input 
                      type="number" min="0" 
                      className="w-12 h-10 text-center font-bold text-lg border border-slate-300 rounded-lg focus:ring-2 focus:ring-sanatorio-pink outline-none"
                      value={pendingScores[match.id]?.away ?? ''}
                      onChange={e => setPendingScores({ ...pendingScores, [match.id]: { ...pendingScores[match.id], away: e.target.value } })}
                    />
                    <button 
                      onClick={() => updateFixtureResult(match.id)}
                      className="ml-2 bg-slate-200 text-slate-600 p-2 rounded-lg hover:bg-slate-300 transition-colors"
                      title="Guardar Carga Rápida"
                    >
                      <Save className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 text-center md:text-left font-bold text-slate-700">{match.away_team?.name}</div>
                  
                  <button 
                    onClick={() => handleStartLiveMatch(match)}
                    className="md:absolute md:right-4 mt-4 md:mt-0 bg-sanatorio-blue text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 justify-center shadow-sm hover:bg-blue-800 transition-colors"
                  >
                    <PlayCircle className="w-4 h-4" /> COMENZAR
                  </button>
                </div>
              ))}
              {pendingMatches.length === 0 && <p className="text-center text-slate-500 py-4">No hay partidos pendientes en el fixture.</p>}
            </div>
          </div>

          {/* Partidos Jugados */}
          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2">
              <CheckCircle className="text-green-500" /> Historial de Jugados
            </h3>
            <div className="space-y-3">
              {completedMatches.map(match => (
                <div key={match.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl hover:border-sanatorio-pink transition-colors bg-white">
                  <div className="flex-1 text-right font-bold text-slate-700">{match.home_team?.name}</div>
                  <div className="mx-6 px-4 py-1.5 bg-slate-100 rounded-lg flex gap-3 font-black text-xl">
                    <span className="text-sanatorio-blue">{match.home_goals}</span>
                    <span className="text-slate-300">-</span>
                    <span className="text-sanatorio-pink">{match.away_goals}</span>
                  </div>
                  <div className="flex-1 text-left font-bold text-slate-700">{match.away_team?.name}</div>
                </div>
              ))}
              {completedMatches.length === 0 && <p className="text-center text-slate-500 py-6">No hay partidos finalizados aún.</p>}
            </div>
          </div>
        </div>

        {/* Formulario de Carga Manual (Columna lateral) */}
        <div className="lg:col-span-1 bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
          <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2">
            <Plus className="text-sanatorio-blue" /> Carga Manual Excepcional
          </h3>
          <p className="text-xs text-slate-500 mb-4">Utiliza esto solo si necesitas cargar un partido fuera del fixture automático.</p>
          <form onSubmit={handleSaveMatch} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha del Partido</label>
              <input type="datetime-local" required value={matchDate} onChange={e => setMatchDate(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 focus:border-sanatorio-blue" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Local</label>
                <select required value={homeTeam} onChange={e => setHomeTeam(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm">
                  <option value="">Seleccionar...</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Goles</label>
                <input type="number" min="0" required value={homeGoals} onChange={e => setHomeGoals(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-center font-bold text-xl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Visitante</label>
                <select required value={awayTeam} onChange={e => setAwayTeam(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm">
                  <option value="">Seleccionar...</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Goles</label>
                <input type="number" min="0" required value={awayGoals} onChange={e => setAwayGoals(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-center font-bold text-xl" />
              </div>
            </div>

            <button type="submit" className="w-full mt-6 bg-slate-800 text-white font-bold py-3 rounded-xl shadow-md hover:bg-slate-900 transition-colors flex justify-center items-center gap-2">
              <Save className="w-5 h-5" /> Forzar Carga
            </button>
          </form>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-sanatorio-blue text-white px-6 py-4">
              <h3 className="font-condensed font-bold text-xl uppercase tracking-wider flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-sanatorio-pink" />
                Confirmar Generación
              </h3>
            </div>
            <div className="p-6">
              <p className="text-slate-600 font-medium mb-6">
                ¿Estás seguro de generar el Fixture Automático? Se cruzarán todos los equipos <strong>Aprobados</strong> (Todos vs Todos). Los partidos aparecerán como "Pendientes" hasta que cargues su resultado.
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmGenerateFixture}
                  className="px-4 py-2 font-bold text-white bg-sanatorio-pink rounded-lg hover:bg-pink-600 shadow-md transition-colors"
                >
                  Generar Fixture
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
