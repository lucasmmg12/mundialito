import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Activity, Plus, Save, ArrowLeft, RefreshCw, CheckCircle, Clock, PlayCircle, Lock, Trophy, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { LiveMatchPanel } from '../../components/LiveMatchPanel';
import { startMatch } from '../../lib/mundialito-service';
import { useAuth } from '../../contexts/AuthContext';

export const AdminMatches = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSemisModal, setShowSemisModal] = useState(false);
  const [semisProjection, setSemisProjection] = useState<any>(null);
  const [showFinalModal, setShowFinalModal] = useState(false);
  const [finalProjection, setFinalProjection] = useState<any>(null);
  const [activeLiveMatch, setActiveLiveMatch] = useState<any | null>(null);

  // Form state for single manual match
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [homeGoals, setHomeGoals] = useState('0');
  const [awayGoals, setAwayGoals] = useState('0');
  const [matchDate, setMatchDate] = useState('');
  const [matchNotes, setMatchNotes] = useState('');

  // Inline edit state for pending fixtures
  const [pendingScores, setPendingScores] = useState<Record<string, { home: string, away: string }>>({});
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  
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

  const calculateStandings = (groupName: string) => {
    const standings: Record<string, { id: string, name: string, points: number, goalDiff: number, played: number }> = {};
    matches.filter(m => m.notes === groupName).forEach(m => {
      if (!standings[m.home_team_id]) standings[m.home_team_id] = { id: m.home_team_id, name: m.home_team?.name, points: 0, goalDiff: 0, played: 0 };
      if (!standings[m.away_team_id]) standings[m.away_team_id] = { id: m.away_team_id, name: m.away_team?.name, points: 0, goalDiff: 0, played: 0 };
      
      if (m.status === 'completed') {
        standings[m.home_team_id].played += 1;
        standings[m.away_team_id].played += 1;
        
        const hG = m.home_goals || 0;
        const aG = m.away_goals || 0;
        standings[m.home_team_id].goalDiff += (hG - aG);
        standings[m.away_team_id].goalDiff += (aG - hG);
        
        if (hG > aG) standings[m.home_team_id].points += 3;
        else if (hG < aG) standings[m.away_team_id].points += 3;
        else {
          standings[m.home_team_id].points += 1;
          standings[m.away_team_id].points += 1;
        }
      }
    });
    return Object.values(standings).sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff);
  };

  if (!session || session.user.email !== 'lmarinero@sanatorioargentino.com.ar') {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl text-center mt-20 border border-slate-100">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Acceso Denegado</h2>
        <p className="text-slate-500 mb-6">Esta sección es exclusiva para la administración del torneo.</p>
        <button onClick={() => navigate('/')} className="bg-sanatorio-blue text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-900 transition-colors w-full">
          Volver al Inicio
        </button>
      </div>
    );
  }

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
        status: 'completed',
        notes: matchNotes || null
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
    
    // Mezclar equipos aleatoriamente
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
    
    // Dividir en 2 grupos (Mitad y mitad, o 4 y 5 si son 9)
    const mid = Math.floor(shuffledTeams.length / 2);
    const groupA = shuffledTeams.slice(0, mid);
    const groupB = shuffledTeams.slice(mid);
    
    let date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(10, 0, 0, 0);

    for (let i = 0; i < groupA.length; i++) {
      for (let j = i + 1; j < groupA.length; j++) {
        newMatches.push({
          home_team_id: groupA[i].id,
          away_team_id: groupA[j].id,
          home_goals: 0,
          away_goals: 0,
          status: 'pending',
          match_date: date.toISOString(),
          notes: 'Grupo A'
        });
      }
    }
    
    for (let i = 0; i < groupB.length; i++) {
      for (let j = i + 1; j < groupB.length; j++) {
        newMatches.push({
          home_team_id: groupB[i].id,
          away_team_id: groupB[j].id,
          home_goals: 0,
          away_goals: 0,
          status: 'pending',
          match_date: date.toISOString(),
          notes: 'Grupo B'
        });
      }
    }
    
    if (newMatches.length > 0) {
      await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const { error } = await supabase.from('matches').insert(newMatches);
      if (error) {
        alert("Error al generar fixture: " + error.message);
      } else {
        fetchData();
      }
    } else {
      alert("No hay equipos suficientes.");
    }
    
    setGenerating(false);
  };

  const generateSemifinals = () => {
    const groupA = calculateStandings('Grupo A');
    const groupB = calculateStandings('Grupo B');

    if (groupA.length < 2 || groupB.length < 2) {
      alert("No hay suficientes partidos completados o equipos en los grupos para armar las semifinales.");
      return;
    }

    const firstA = groupA[0];
    const secondA = groupA[1];
    const firstB = groupB[0];
    const secondB = groupB[1];

    setSemisProjection({ firstA, secondA, firstB, secondB });
    setShowSemisModal(true);
  };

  const confirmGenerateSemifinals = async () => {
    setShowSemisModal(false);
    setGenerating(true);
    
    let date = new Date();
    date.setDate(date.getDate() + 2);
    date.setHours(10, 0, 0, 0);

    const semis = [
      {
        home_team_id: semisProjection.firstA.id,
        away_team_id: semisProjection.secondB.id,
        status: 'pending',
        match_date: date.toISOString(),
        notes: 'Semifinal 1'
      },
      {
        home_team_id: semisProjection.firstB.id,
        away_team_id: semisProjection.secondA.id,
        status: 'pending',
        match_date: date.toISOString(),
        notes: 'Semifinal 2'
      }
    ];

    const { error } = await supabase.from('matches').insert(semis);
    if (error) {
      alert("Error generando semifinales: " + error.message);
    } else {
      alert("Semifinales creadas con éxito.");
      fetchData();
    }
    setGenerating(false);
  };

  const generateFinal = () => {
    const semi1 = matches.find(m => m.notes === 'Semifinal 1' && m.status === 'completed');
    const semi2 = matches.find(m => m.notes === 'Semifinal 2' && m.status === 'completed');

    if (!semi1 || !semi2) {
      alert("Deben jugarse y completarse ambas semifinales primero.");
      return;
    }

    const winner1 = semi1.home_goals > semi1.away_goals ? { id: semi1.home_team_id, name: semi1.home_team?.name } : (semi1.away_goals > semi1.home_goals ? { id: semi1.away_team_id, name: semi1.away_team?.name } : null);
    const winner2 = semi2.home_goals > semi2.away_goals ? { id: semi2.home_team_id, name: semi2.home_team?.name } : (semi2.away_goals > semi2.home_goals ? { id: semi2.away_team_id, name: semi2.away_team?.name } : null);

    if (!winner1 || !winner2) {
      alert("Hay un empate en alguna semifinal. Ajusta los goles para definir un ganador antes de generar la final.");
      return;
    }

    setFinalProjection({ team1: winner1, team2: winner2 });
    setShowFinalModal(true);
  };

  const confirmGenerateFinal = async () => {
    setShowFinalModal(false);
    setGenerating(true);
    
    let date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(10, 0, 0, 0);

    const { error } = await supabase.from('matches').insert([{
      home_team_id: finalProjection.team1.id,
      away_team_id: finalProjection.team2.id,
      status: 'pending',
      match_date: date.toISOString(),
      notes: 'Final'
    }]);

    if (error) {
      alert("Error generando final: " + error.message);
    } else {
      alert("Final creada con éxito.");
      fetchData();
    }
    setGenerating(false);
  };

  const deleteMatch = async (matchId: string) => {
    if (!window.confirm("¿Estás seguro de eliminar este partido? Esta acción no se puede deshacer.")) return;
    const { error } = await supabase.from('matches').delete().eq('id', matchId);
    if (error) {
      alert("Error al eliminar: " + error.message);
    } else {
      fetchData();
    }
  };

  const updateFixtureResult = async (matchId: string) => {
    const scores = pendingScores[matchId];
    if (scores.home === '' || scores.away === '') {
      return alert("Debe ingresar los goles de ambos equipos.");
    }

    setSavingMatchId(matchId);
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
    setSavingMatchId(null);
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
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={generateFinal}
            disabled={generating}
            className="flex-1 md:flex-none bg-yellow-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-md hover:bg-yellow-600 transition-colors flex items-center gap-2 justify-center disabled:opacity-50"
          >
            <Star className="w-5 h-5" />
            Generar Final
          </button>
          <button 
            onClick={generateSemifinals}
            disabled={generating}
            className="flex-1 md:flex-none bg-purple-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-md hover:bg-purple-700 transition-colors flex items-center gap-2 justify-center disabled:opacity-50"
          >
            <Trophy className="w-5 h-5" />
            Generar Semis
          </button>
          <button 
            onClick={handleGenerateClick}
            disabled={generating}
            className="flex-1 md:flex-none bg-sanatorio-pink text-white font-bold px-4 py-2.5 rounded-xl shadow-md hover:bg-pink-600 transition-colors flex items-center gap-2 justify-center disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generando...' : 'Generar Fixture'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Historial y Fixture */}
        <div className="lg:col-span-2 space-y-6">

          {/* Estadísticas de Grupos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: 'Grupo A', data: calculateStandings('Grupo A') },
              { name: 'Grupo B', data: calculateStandings('Grupo B') }
            ].map(group => group.data.length > 0 && (
              <div key={group.name} className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-xl text-slate-800 mb-4 flex items-center gap-2">
                  <Trophy className="text-yellow-500 w-5 h-5" /> Posiciones {group.name}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="py-2 px-3 font-bold text-slate-500">Equipo</th>
                        <th className="py-2 px-3 font-bold text-slate-500 text-center">PJ</th>
                        <th className="py-2 px-3 font-bold text-slate-500 text-center">DIF</th>
                        <th className="py-2 px-3 font-bold text-sanatorio-blue text-center">PTS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.data.map((team, index) => (
                        <tr key={team.id} className={`border-b border-slate-100 ${index < 2 ? 'bg-green-50/50' : ''}`}>
                          <td className="py-2 px-3 font-bold text-slate-700">{team.name}</td>
                          <td className="py-2 px-3 text-center text-slate-600">{team.played}</td>
                          <td className="py-2 px-3 text-center text-slate-600">{team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}</td>
                          <td className="py-2 px-3 text-center font-bold text-sanatorio-blue">{team.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
          
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
                      disabled={savingMatchId === match.id}
                      className="ml-2 bg-slate-200 text-slate-600 p-2 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50"
                      title="Guardar Carga Rápida"
                    >
                      {savingMatchId === match.id ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="flex-1 text-center md:text-left font-bold text-slate-700">{match.away_team?.name}</div>
                  
                  <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0 md:absolute md:right-4">
                    <button 
                      onClick={() => handleStartLiveMatch(match)}
                      className="bg-sanatorio-blue text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 justify-center shadow-sm hover:bg-blue-800 transition-colors"
                    >
                      <PlayCircle className="w-4 h-4" /> COMENZAR
                    </button>
                    <button 
                      onClick={() => deleteMatch(match.id)}
                      className="bg-white text-red-500 border border-red-200 px-3 py-2 rounded-lg font-bold text-sm flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors"
                      title="Eliminar Partido"
                    >
                      Eliminar
                    </button>
                  </div>
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

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Fase / Notas (Ej: Semifinal)</label>
              <input type="text" value={matchNotes} onChange={e => setMatchNotes(e.target.value)} placeholder="Opcional" className="w-full p-2 rounded-lg border border-slate-200 focus:border-sanatorio-blue" />
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
                ¿Estás seguro de generar el Fixture Automático? Se borrarán todos los partidos existentes y se generarán dos grupos aleatorios (A y B) con sus respectivos cruces.
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

      {showSemisModal && semisProjection && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-purple-600 text-white px-6 py-4">
              <h3 className="font-condensed font-bold text-xl uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Confirmar Semifinales
              </h3>
            </div>
            <div className="p-6">
              <p className="text-slate-600 font-medium mb-4">
                Se generarán las siguientes semifinales:
              </p>
              <ul className="space-y-2 mb-6 text-slate-800 font-bold bg-slate-50 p-4 rounded-xl border border-slate-100">
                <li>1. {semisProjection.firstA.name} (1ºA) vs {semisProjection.secondB.name} (2ºB)</li>
                <li>2. {semisProjection.firstB.name} (1ºB) vs {semisProjection.secondA.name} (2ºA)</li>
              </ul>
              <p className="text-sm text-slate-500 italic mb-6">
                ¿Estás de acuerdo? (Luego podrás eliminarlas y cargarlas manualmente si necesitas editarlas).
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowSemisModal(false)}
                  className="px-4 py-2 font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmGenerateSemifinals}
                  className="px-4 py-2 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 shadow-md transition-colors"
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFinalModal && finalProjection && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-yellow-500 text-white px-6 py-4">
              <h3 className="font-condensed font-bold text-xl uppercase tracking-wider flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-100" />
                Confirmar Final
              </h3>
            </div>
            <div className="p-6">
              <p className="text-slate-600 font-medium mb-4">
                Se generará el partido de la Gran Final:
              </p>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200 text-center mb-6 shadow-sm">
                <p className="font-bold text-slate-800 text-xl">{finalProjection.team1.name}</p>
                <p className="text-yellow-600 font-black my-2">VS</p>
                <p className="font-bold text-slate-800 text-xl">{finalProjection.team2.name}</p>
              </div>
              <p className="text-sm text-slate-500 italic mb-6">
                ¿Estás de acuerdo?
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowFinalModal(false)}
                  className="px-4 py-2 font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmGenerateFinal}
                  className="px-4 py-2 font-bold text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 shadow-md transition-colors"
                >
                  Generar Partido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
