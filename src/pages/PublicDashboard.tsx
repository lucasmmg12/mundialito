import { useEffect, useState, useMemo } from 'react';
import { Trophy, Activity, Star, Target, Shield, Lock, BookOpen, Calendar, Image, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Onboarding } from '../components/Onboarding';
import { GuidedTour } from '../components/GuidedTour';

export const PublicDashboard = () => {
  const [groupAStandings, setGroupAStandings] = useState<any[]>([]);
  const [groupBStandings, setGroupBStandings] = useState<any[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ topScorer: null, topAssists: null, topMVP: null });
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [activeStatInfo, setActiveStatInfo] = useState<{title: string, explanation: string} | null>(null);

  // Onboarding & Tour state
  const [showOnboarding, setShowOnboarding] = useState(!sessionStorage.getItem('mundialito_onboarding_seen'));
  const [showTour, setShowTour] = useState(false);

  const handleOnboardingComplete = () => {
    sessionStorage.setItem('mundialito_onboarding_seen', 'true');
    setShowOnboarding(false);
    if (!sessionStorage.getItem('mundialito_tour_seen')) {
      setShowTour(true);
    }
  };

  const handleTourComplete = () => {
    sessionStorage.setItem('mundialito_tour_seen', 'true');
    setShowTour(false);
  };

  useEffect(() => {
    fetchData();
    if (!showOnboarding && !sessionStorage.getItem('mundialito_tour_seen')) {
      setShowTour(true);
    }
  }, [showOnboarding]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Teams
      const { data: teamsData } = await supabase.from('teams').select('*').eq('status', 'active');
      if (teamsData) setTeams(teamsData);
      
      // 2. Fetch Matches (Completed and Pending)
      const { data: matchesData } = await supabase.from('matches').select('*, home_team:home_team_id(name, logo_url), away_team:away_team_id(name, logo_url)').order('match_date', { ascending: false });
      
      if (matchesData) {
        const completed = matchesData.filter(m => m.status === 'completed');
        const pending = matchesData.filter(m => m.status === 'pending').reverse(); // Ascending for upcoming
        setRecentMatches(completed);
        setUpcomingMatches(pending);
      }

      // Calculate Standings
      if (teamsData && matchesData) {
        const createGroupTable = (groupNotes: string) => {
          const groupTeams = new Set<string>();
          matchesData.forEach((m: any) => {
            if (m.notes === groupNotes) {
              groupTeams.add(m.home_team_id);
              groupTeams.add(m.away_team_id);
            }
          });

          let table = Array.from(groupTeams).map(teamId => {
             const t = teamsData.find((t: any) => t.id === teamId);
             return { id: teamId, team: t?.name || '?', pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, form: [] as string[] };
          });
          
          matchesData.forEach((m: any) => {
            if (m.notes !== groupNotes || m.status !== 'completed') return;
            let home = table.find(t => t.id === m.home_team_id);
            let away = table.find(t => t.id === m.away_team_id);
            if (!home || !away) return;

            home.pj++; away.pj++;
            home.gf += m.home_goals; home.gc += m.away_goals;
            away.gf += m.away_goals; away.gc += m.home_goals;

            if (m.home_goals > m.away_goals) {
              home.pg++; home.pts += 3; home.form.unshift('W');
              away.pp++; away.form.unshift('L');
            } else if (m.home_goals < m.away_goals) {
              away.pg++; away.pts += 3; away.form.unshift('W');
              home.pp++; home.form.unshift('L');
            } else {
              home.pe++; away.pe++;
              home.pts += 1; away.pts += 1;
              home.form.unshift('D'); away.form.unshift('D');
            }
          });

          table.sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc));
          return table;
        };

        setGroupAStandings(createGroupTable('Grupo A'));
        setGroupBStandings(createGroupTable('Grupo B'));
      }

      // 3. Fetch Top Stats (Top 5 for rankings)
      const { data: scorers } = await supabase.from('players').select('id, full_name, goals, team:team_id(name)').gt('goals', 0).order('goals', { ascending: false }).limit(5);
      const { data: assists } = await supabase.from('players').select('id, full_name, assists, team:team_id(name)').gt('assists', 0).order('assists', { ascending: false }).limit(5);
      const { data: mvps } = await supabase.from('players').select('id, full_name, mvp_awards, team:team_id(name)').gt('mvp_awards', 0).order('mvp_awards', { ascending: false }).limit(5);

      setStats({
        topScorer: scorers?.[0] || { full_name: 'N/A', goals: 0, team: { name: '-' } },
        topAssists: assists?.[0] || { full_name: 'N/A', assists: 0, team: { name: '-' } },
        topMVP: mvps?.[0] || { full_name: 'N/A', mvp_awards: 0, team: { name: '-' } },
        scorersList: scorers || [],
        assistsList: assists || [],
        mvpsList: mvps || []
      });

    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const filteredRecentMatches = useMemo(() => {
    return selectedTeamFilter === 'all' 
      ? recentMatches 
      : recentMatches.filter(m => m.home_team_id === selectedTeamFilter || m.away_team_id === selectedTeamFilter);
  }, [recentMatches, selectedTeamFilter]);

  const filteredUpcomingMatches = useMemo(() => {
    return selectedTeamFilter === 'all'
      ? upcomingMatches
      : upcomingMatches.filter(m => m.home_team_id === selectedTeamFilter || m.away_team_id === selectedTeamFilter);
  }, [upcomingMatches, selectedTeamFilter]);

  const StatCard = ({ title, value, subtitle, icon: Icon, bgGradient, explanation }: any) => (
    <div 
      onClick={() => setActiveStatInfo({ title, explanation })}
      className={`relative overflow-hidden rounded-2xl p-4 shadow-lg ${bgGradient} transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group border border-white/20 flex items-center justify-between min-h-[90px] cursor-pointer`}
    >
      {/* Background Icon */}
      <Icon className="absolute -right-2 top-1/2 -translate-y-1/2 w-24 h-24 text-white/10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500" strokeWidth={1} />
      
      {/* Content */}
      <div className="relative z-10 flex items-center gap-4 w-full">
        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner shrink-0">
           <Icon className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-0.5 drop-shadow-sm flex items-center gap-1">
            {title}
          </p>
          <h3 className="text-xl font-bold text-white leading-tight truncate drop-shadow-md">{value}</h3>
          <p className="text-xs font-semibold text-white/90 truncate">{subtitle}</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <GuidedTour run={showTour} onComplete={handleTourComplete} />
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      <div className={`max-w-7xl mx-auto space-y-8 pb-16 transition-opacity duration-1000 ${showOnboarding ? 'opacity-0 h-screen overflow-hidden' : 'opacity-100'}`}>
      {/* HEADER */}
      <div className="tour-header bg-gradient-to-r from-sanatorio-blue via-[#1a4f8f] to-sanatorio-pink rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden group">
        {/* GIF Background */}
        <img src="/38828245eec2410920bcf534c962029f.gif" alt="Fondo Animado" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay z-0 pointer-events-none" />

        <Link to="/admin" className="absolute top-4 right-4 p-2 text-white/30 hover:text-white transition-colors z-20" title="Acceso Administrativo">
          <Lock className="w-5 h-5" />
        </Link>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 z-0"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 z-0"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="font-condensed text-5xl md:text-6xl font-bold mb-2 tracking-tight drop-shadow-md">PORTAL DEL TORNEO</h1>
            <p className="text-white/90 font-medium text-lg md:text-xl max-w-2xl drop-shadow-sm mb-6">
              Sigue de cerca los resultados, estadísticas y la tabla de posiciones del Mundialito Mixto 2026.
            </p>
            <Link to="/reglamento" className="tour-rules inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider transition-all border border-white/30 shadow-sm">
              <BookOpen className="w-5 h-5" /> Ver Comunicación y Reglamento
            </Link>
          </div>
          <div className="hidden md:flex items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
             <Trophy className="w-16 h-16 text-white opacity-90 drop-shadow-lg" />
          </div>
        </div>
      </div>

      {/* HIGHLIGHT STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Goleador" 
          value={stats.topScorer ? `${stats.topScorer.full_name} (${stats.topScorer.goals})` : 'Cargando...'} 
          subtitle={stats.topScorer?.team?.name} 
          icon={Target} 
          bgGradient="bg-gradient-to-br from-[#ff0f7b] to-[#f89b29]" 
          explanation="Muestra al jugador con la mayor cantidad de goles convertidos en lo que va del torneo."
        />
        <StatCard 
          title="Rey de Asistencias" 
          value={stats.topAssists ? `${stats.topAssists.full_name} (${stats.topAssists.assists})` : 'Cargando...'} 
          subtitle={stats.topAssists?.team?.name} 
          icon={Activity} 
          bgGradient="bg-gradient-to-br from-[#00c6ff] to-[#0072ff]" 
          explanation="Destaca al jugador que ha dado el mayor número de pases de gol (asistencias) a sus compañeros."
        />
        <StatCard 
          title="Ranking MVP" 
          value={stats.topMVP ? `${stats.topMVP.full_name} (${stats.topMVP.mvp_awards})` : 'Cargando...'} 
          subtitle={stats.topMVP?.team?.name} 
          icon={Star} 
          bgGradient="bg-gradient-to-br from-[#8E2DE2] to-[#4A00E0]" 
          explanation="El Jugador Más Valioso. Al finalizar cada partido se elige a un MVP por su desempeño destacado en la cancha."
        />
        <StatCard 
          title="Premio Fair Play" 
          value="Administración" 
          subtitle="Solo 2 amarillas" 
          icon={Shield} 
          bgGradient="bg-gradient-to-br from-[#11998e] to-[#38ef7d]" 
          explanation="Este premio se otorgará al finalizar el torneo al equipo con mejor conducta, basándose en la menor cantidad de tarjetas recibidas."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* STANDINGS TABLES */}
        <div className="tour-standings lg:col-span-2 order-2 lg:order-1 flex flex-col gap-8">
          
          {[
            { name: 'Grupo A', data: groupAStandings, color: 'text-sanatorio-blue', border: 'border-sanatorio-blue', badge: 'bg-sanatorio-blue' },
            { name: 'Grupo B', data: groupBStandings, color: 'text-sanatorio-pink', border: 'border-sanatorio-pink', badge: 'bg-sanatorio-pink' }
          ].map(group => group.data.length > 0 && (
            <div key={group.name} className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg border-2 border-slate-100 overflow-hidden">
              <div className={`px-8 py-6 border-b-4 ${group.border} flex justify-between items-center bg-gradient-to-r from-slate-50 to-white`}>
                <h2 className={`text-2xl font-condensed font-bold ${group.color} flex items-center gap-3 uppercase tracking-wide`}>
                  <Trophy className={`${group.color} w-6 h-6`} /> Posiciones {group.name}
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                      <th className="p-4 text-center w-12">Pos</th>
                      <th className="p-4">Equipo</th>
                      <th className="p-4 text-center">Pts</th>
                      <th className="p-4 text-center hidden sm:table-cell">PJ</th>
                      <th className="p-4 text-center hidden md:table-cell">G</th>
                      <th className="p-4 text-center hidden md:table-cell">E</th>
                      <th className="p-4 text-center hidden md:table-cell">P</th>
                      <th className="p-4 text-center hidden sm:table-cell">GF</th>
                      <th className="p-4 text-center hidden sm:table-cell">GC</th>
                      <th className="p-4 text-center">DIF</th>
                      <th className="p-4 text-center">Forma</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.data.map((team, idx) => (
                      <tr key={team.id} className={`border-t border-slate-100 transition-colors ${idx < 2 ? 'bg-green-50/30 hover:bg-green-50/60' : 'hover:bg-slate-50/50'}`}>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold shadow-sm ${
                            idx < 2 ? 'bg-green-500 text-white scale-110' : 'text-slate-500 bg-slate-100'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-800 text-base">{team.team} {idx < 2 && <span className="ml-2 text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm border border-green-600">Clasifica</span>}</td>
                        <td className="p-4 text-center font-black text-sanatorio-pink text-xl">{team.pts}</td>
                        <td className="p-4 text-center hidden sm:table-cell text-slate-600">{team.pj}</td>
                        <td className="p-4 text-center hidden md:table-cell text-green-600">{team.pg}</td>
                        <td className="p-4 text-center hidden md:table-cell text-slate-500">{team.pe}</td>
                        <td className="p-4 text-center hidden md:table-cell text-red-600">{team.pp}</td>
                        <td className="p-4 text-center hidden lg:table-cell text-slate-500">{team.gf}</td>
                        <td className="p-4 text-center hidden lg:table-cell text-slate-500">{team.gc}</td>
                        <td className="p-4 text-center font-bold text-slate-700 hidden sm:table-cell">{team.gf - team.gc}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1">
                            {team.form.slice(0, 5).map((result: string, i: number) => (
                              <span key={i} title={result === 'W' ? 'Ganado' : result === 'D' ? 'Empate' : 'Perdido'} className={`w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${
                                result === 'W' ? 'bg-sanatorio-blue' : result === 'D' ? 'bg-slate-300' : 'bg-sanatorio-pink'
                              }`}>
                                {result}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}


        </div>

        {/* LATEST RESULTS WIDGET */}
        <div className="tour-results flex flex-col gap-6 order-1 lg:order-2">
          
        {/* PRODE WIDGET (Instagram style) */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden flex flex-col">
          {/* Header (Instagram style) */}
          <div className="p-4 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-sanatorio-pink to-purple-500 p-[2px]">
                <div className="bg-white rounded-full p-[2px] w-full h-full">
                  <img src="/mundialito.jpeg" alt="Avatar" className="w-full h-full rounded-full object-cover" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800 leading-none mb-1">mundialito_sanatorio</h4>
                <p className="text-xs text-slate-500 leading-none">Torneo 2026</p>
              </div>
            </div>
            <div className="text-slate-400 tracking-widest font-bold">•••</div>
          </div>
          
          {/* Image */}
          <div className="relative aspect-square bg-slate-50">
            <img src="/prode.png" alt="Prode Oficial" className="w-full h-full object-cover" />
          </div>
          
          {/* Actions & Caption */}
          <div className="p-4">
            <div className="flex items-center gap-4 mb-3 text-slate-700">
              <Trophy className="w-7 h-7 hover:text-sanatorio-pink transition-colors cursor-pointer" />
              <Star className="w-7 h-7 hover:text-yellow-500 transition-colors cursor-pointer" />
            </div>
            <p className="text-sm text-slate-800 mb-4 leading-relaxed">
              <span className="font-bold mr-2">mundialito_sanatorio</span>
              ¡Ya está habilitado el PRODE OFICIAL! 🏆 Acierta los resultados de los partidos, suma puntos y competí por el 1º puesto del ranking general. ¿Qué esperás para jugar?
            </p>
            <Link to="/prode/auth" className="block w-full text-center bg-gradient-to-r from-sanatorio-pink to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md">
              Participar Ahora
            </Link>
          </div>
        </div>

        {/* SHARE WIDGET (Instagram style) */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden flex flex-col">
          {/* Header (Instagram style) */}
          <div className="p-4 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-sanatorio-pink to-purple-500 p-[2px]">
                <div className="bg-white rounded-full p-[2px] w-full h-full">
                  <img src="/mundialito.jpeg" alt="Avatar" className="w-full h-full rounded-full object-cover" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800 leading-none mb-1">mundialito_sanatorio</h4>
                <p className="text-xs text-slate-500 leading-none">Torneo 2026</p>
              </div>
            </div>
            <div className="text-slate-400 tracking-widest font-bold">•••</div>
          </div>
          
          {/* Image */}
          <div className="relative aspect-square bg-slate-50">
            <img src="/mundialitocompartir.jpg" alt="Compartí tu experiencia" className="w-full h-full object-cover" />
          </div>
          
          {/* Actions & Caption */}
          <div className="p-4">
            <div className="flex items-center gap-4 mb-3 text-slate-700">
              <Image className="w-7 h-7 hover:text-sanatorio-blue transition-colors cursor-pointer" />
            </div>
            <p className="text-sm text-slate-800 mb-4 leading-relaxed">
              <span className="font-bold mr-2">mundialito_sanatorio</span>
              ¡Compartí tu experiencia dentro de la cancha! 📸 Entrá al Blog oficial del torneo, subí fotos de tu equipo, dejá comentarios y vivamos juntos esta fiesta del deporte.
            </p>
            <Link to="/blog" className="block w-full text-center bg-sanatorio-blue hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md">
              Ir al Blog del Evento
            </Link>
          </div>
        </div>

        {/* TEAM FILTER WIDGET */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg border-2 border-slate-100 overflow-hidden flex flex-col p-6">
          <label className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
            <Filter className="w-4 h-4 text-sanatorio-blue" /> Filtrar partidos por equipo
          </label>
          <select 
            value={selectedTeamFilter}
            onChange={(e) => setSelectedTeamFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 outline-none focus:border-sanatorio-blue focus:ring-2 focus:ring-sanatorio-blue/20 transition-all font-bold cursor-pointer shadow-sm"
          >
            <option value="all">Ver Todos los Equipos</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg border-2 border-slate-100 overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b-4 border-sanatorio-blue bg-gradient-to-r from-slate-50 to-white">
            <h2 className="text-xl font-condensed font-bold text-sanatorio-blue uppercase tracking-wide flex items-center gap-2">
              <Activity className="text-sanatorio-pink w-5 h-5" /> Resultados Oficiales
            </h2>
          </div>
          <div className="p-6 flex-1 flex flex-col gap-4 max-h-[500px] overflow-y-auto">
            
            {loading ? (
              <div className="text-center text-slate-500 font-bold">Cargando resultados...</div>
            ) : filteredRecentMatches.map(match => (
              <div key={match.id} className={`bg-white rounded-xl p-4 border shadow-sm transition-colors ${match.status === 'pending' ? 'border-dashed border-slate-300 hover:border-sanatorio-blue' : 'border-slate-100 hover:border-sanatorio-pink'}`}>
                <div className="text-center text-[10px] text-sanatorio-blue font-bold tracking-widest mb-3 bg-slate-50 py-1 rounded">
                  {new Date(match.match_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
                </div>
                <div className="flex items-start justify-between w-full">
                  <div className="flex flex-col items-center w-[40%] gap-2 text-center">
                    <img src={match.home_team?.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${match.home_team?.name}&backgroundColor=0369a1`} alt={match.home_team?.name} className="w-14 h-14 sm:w-12 sm:h-12 rounded-full border-2 border-slate-200 shadow-sm bg-white object-cover shrink-0" />
                    <span className="font-bold text-slate-800 text-[11px] sm:text-sm leading-tight max-w-[120px]">{match.home_team?.name}</span>
                  </div>
                  
                  <div className="flex flex-col items-center w-[20%] pt-2">
                  {match.status === 'completed' ? (
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-sanatorio-blue to-sanatorio-pink px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-md mb-1">
                        <span className="font-black text-base sm:text-xl text-white">{match.home_goals}</span>
                        <span className="text-white/70 font-bold text-sm sm:text-base">-</span>
                        <span className="font-black text-base sm:text-xl text-white">{match.away_goals}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Final</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center bg-slate-100 px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg border border-slate-200">
                      <span className="font-black text-slate-400 text-xs sm:text-sm">VS</span>
                    </div>
                  )}
                  </div>

                  <div className="flex flex-col items-center w-[40%] gap-2 text-center">
                    <img src={match.away_team?.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${match.away_team?.name}&backgroundColor=db2777`} alt={match.away_team?.name} className="w-14 h-14 sm:w-12 sm:h-12 rounded-full border-2 border-slate-200 shadow-sm bg-white object-cover shrink-0" />
                    <span className="font-semibold text-slate-600 text-[11px] sm:text-sm leading-tight max-w-[120px]">{match.away_team?.name}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredRecentMatches.length === 0 && !loading && (
              <div className="text-center text-slate-500 italic text-sm my-auto">Aún no se han registrado partidos oficiales para esta selección.</div>
            )}
          </div>
        </div>

        {/* UPCOMING MATCHES WIDGET */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg border-2 border-slate-100 overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b-4 border-[#f89b29] bg-gradient-to-r from-slate-50 to-white">
            <h2 className="text-xl font-condensed font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Calendar className="text-[#f89b29] w-5 h-5" /> Fixture Completo (Pendientes)
            </h2>
          </div>
          <div className="p-6 flex-1 flex flex-col gap-4 max-h-[500px] overflow-y-auto">
            
            {loading ? (
              <div className="text-center text-slate-500 font-bold">Cargando partidos...</div>
            ) : filteredUpcomingMatches.map(match => (
              <div key={match.id} className="bg-slate-50 rounded-xl p-4 border border-dashed border-slate-300 hover:border-sanatorio-pink transition-colors">
                <div className="text-center text-[10px] text-slate-500 font-bold tracking-widest mb-3 py-1 rounded bg-white shadow-sm inline-block px-3 mx-auto flex items-center justify-center w-fit">
                  {new Date(match.match_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
                </div>
                <div className="flex items-start justify-between w-full">
                  <div className="flex flex-col items-center w-[40%] gap-2 text-center">
                    <img src={match.home_team?.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${match.home_team?.name}&backgroundColor=0369a1`} alt={match.home_team?.name} className="w-14 h-14 sm:w-12 sm:h-12 rounded-full border-2 border-slate-200 shadow-sm bg-white object-cover shrink-0" />
                    <span className="font-bold text-slate-800 text-[11px] sm:text-sm leading-tight max-w-[120px]">{match.home_team?.name}</span>
                  </div>
                  
                  <div className="flex flex-col items-center w-[20%] pt-2">
                    <div className="flex items-center justify-center bg-white px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg border border-slate-200 shadow-sm">
                      <span className="font-black text-slate-400 text-xs sm:text-sm">VS</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center w-[40%] gap-2 text-center">
                    <img src={match.away_team?.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${match.away_team?.name}&backgroundColor=db2777`} alt={match.away_team?.name} className="w-14 h-14 sm:w-12 sm:h-12 rounded-full border-2 border-slate-200 shadow-sm bg-white object-cover shrink-0" />
                    <span className="font-semibold text-slate-600 text-[11px] sm:text-sm leading-tight max-w-[120px]">{match.away_team?.name}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredUpcomingMatches.length === 0 && !loading && (
              <div className="text-center text-slate-500 italic text-sm my-auto">No hay partidos programados para esta selección.</div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* DETAILED RANKINGS */}
      <div className="tour-stats grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        {/* Tabla Goleadores */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-condensed font-bold text-xl text-sanatorio-pink mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Target className="w-5 h-5" /> Tabla de Goleadores
          </h3>
          <div className="space-y-3">
            {stats.scorersList?.length > 0 ? stats.scorersList.map((p: any, idx: number) => (
              <div key={p.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="font-black text-slate-300 w-4">{idx + 1}</span>
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${p.full_name}`} alt="Avatar" className="w-8 h-8 rounded-full bg-sanatorio-pink/10 border border-sanatorio-pink/20" />
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{p.full_name}</div>
                    <div className="text-xs text-slate-500 font-semibold">{p.team?.name}</div>
                  </div>
                </div>
                <div className="font-black text-sanatorio-pink text-xl bg-sanatorio-pink/10 w-10 h-10 rounded-full flex items-center justify-center">{p.goals}</div>
              </div>
            )) : <p className="text-center text-slate-400 text-sm py-4">Aún no hay goles registrados.</p>}
          </div>
        </div>

        {/* Tabla Asistencias */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-condensed font-bold text-xl text-sanatorio-blue mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Activity className="w-5 h-5" /> Máximos Asistidores
          </h3>
          <div className="space-y-3">
            {stats.assistsList?.length > 0 ? stats.assistsList.map((p: any, idx: number) => (
              <div key={p.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="font-black text-slate-300 w-4">{idx + 1}</span>
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${p.full_name}`} alt="Avatar" className="w-8 h-8 rounded-full bg-sanatorio-blue/10 border border-sanatorio-blue/20" />
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{p.full_name}</div>
                    <div className="text-xs text-slate-500 font-semibold">{p.team?.name}</div>
                  </div>
                </div>
                <div className="font-black text-sanatorio-blue text-xl bg-sanatorio-blue/10 w-10 h-10 rounded-full flex items-center justify-center">{p.assists}</div>
              </div>
            )) : <p className="text-center text-slate-400 text-sm py-4">Aún no hay asistencias registradas.</p>}
          </div>
        </div>

        {/* Tabla MVP */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-condensed font-bold text-xl text-purple-600 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Star className="w-5 h-5" /> Ranking MVP
          </h3>
          <div className="space-y-3">
            {stats.mvpsList?.length > 0 ? stats.mvpsList.map((p: any, idx: number) => (
              <div key={p.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="font-black text-slate-300 w-4">{idx + 1}</span>
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${p.full_name}`} alt="Avatar" className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200" />
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{p.full_name}</div>
                    <div className="text-xs text-slate-500 font-semibold">{p.team?.name}</div>
                  </div>
                </div>
                <div className="font-black text-purple-600 text-xl bg-purple-50 w-10 h-10 rounded-full flex items-center justify-center">{p.mvp_awards}</div>
              </div>
            )) : <p className="text-center text-slate-400 text-sm py-4">Aún no hay premios MVP.</p>}
          </div>
        </div>
      </div>
      </div>
      
      {/* Info Modal para Estadísticas */}
      {activeStatInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveStatInfo(null)} />
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs relative z-10 shadow-2xl animate-in fade-in zoom-in-95 border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-3">{activeStatInfo.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">{activeStatInfo.explanation}</p>
            <button 
              onClick={() => setActiveStatInfo(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
