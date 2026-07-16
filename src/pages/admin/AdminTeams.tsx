import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { uploadPlayerPhoto, updatePlayerPhotoUrl } from '../../lib/mundialito-service';
import { Users, CheckCircle, XCircle, Clock, ArrowLeft, ChevronDown, ChevronUp, Save, User, Plus, Edit2, Trash2, X, Link as LinkIcon, Camera, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminTeams = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [nicknames, setNicknames] = useState<Record<string, string>>({});
  const [savingNickname, setSavingNickname] = useState<string | null>(null);

  // Player Form State
  const [editingPlayer, setEditingPlayer] = useState<any | null>(null);
  const [isAddingPlayerToTeam, setIsAddingPlayerToTeam] = useState<string | null>(null);
  const [playerForm, setPlayerForm] = useState({ full_name: '', dni: '', gender: 'M', shirt_number: '', nickname: '' });
  const [isSavingForm, setIsSavingForm] = useState(false);

  // Photo Upload State
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingPlayerId, setUploadingPlayerId] = useState<string | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('teams')
      .select('*, players(*)')
      .order('created_at', { ascending: false });
    
    if (error) console.error(error);
    else {
      setTeams(data || []);
      const initialNicknames: Record<string, string> = {};
      data?.forEach(team => {
        team.players?.forEach((p: any) => {
          initialNicknames[p.id] = p.nickname || '';
        });
      });
      setNicknames(initialNicknames);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('teams')
      .update({ status })
      .eq('id', id);
    
    if (error) {
      alert('Error al actualizar el estado: ' + error.message);
    } else {
      fetchTeams();
    }
  };

  const saveNickname = async (playerId: string) => {
    setSavingNickname(playerId);
    const nickname = nicknames[playerId];
    const { error } = await supabase
      .from('players')
      .update({ nickname })
      .eq('id', playerId);
      
    if (error) {
      alert('Error al guardar apodo: ' + error.message);
    }
    setSavingNickname(null);
  };

  const toggleExpand = (teamId: string) => {
    setExpandedTeamId(expandedTeamId === teamId ? null : teamId);
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar a este jugador? Esta acción no se puede deshacer.")) return;
    const { error } = await supabase.from('players').delete().eq('id', playerId);
    if (error) alert('Error al eliminar: ' + error.message);
    else fetchTeams();
  };

  const openAddPlayer = (teamId: string) => {
    setPlayerForm({ full_name: '', dni: '', gender: 'M', shirt_number: '', nickname: '' });
    setIsAddingPlayerToTeam(teamId);
  };

  const openEditPlayer = (player: any) => {
    setPlayerForm({
      full_name: player.full_name || '',
      dni: player.dni || '',
      gender: player.gender || 'M',
      shirt_number: player.shirt_number || '',
      nickname: player.nickname || ''
    });
    setEditingPlayer(player);
  };

  const closePlayerModal = () => {
    setIsAddingPlayerToTeam(null);
    setEditingPlayer(null);
  };

  const handleSavePlayer = async () => {
    if (!playerForm.full_name.trim()) return alert('El nombre completo es obligatorio.');
    setIsSavingForm(true);
    
    if (editingPlayer) {
      const { error } = await supabase.from('players').update(playerForm).eq('id', editingPlayer.id);
      if (error) alert('Error al actualizar: ' + error.message);
      else { closePlayerModal(); fetchTeams(); }
    } else if (isAddingPlayerToTeam) {
      const { error } = await supabase.from('players').insert([{ ...playerForm, team_id: isAddingPlayerToTeam }]);
      if (error) alert('Error al guardar: ' + error.message);
      else { closePlayerModal(); fetchTeams(); }
    }
    
    setIsSavingForm(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingPlayerId) return;
    
    try {
      setTeams(teams.map(t => ({
        ...t,
        players: t.players?.map((p: any) => p.id === uploadingPlayerId ? { ...p, isUploading: true } : p)
      })));
      
      const url = await uploadPlayerPhoto(file);
      await updatePlayerPhotoUrl(uploadingPlayerId, url);
      
      setTeams(teams.map(t => ({
        ...t,
        players: t.players?.map((p: any) => p.id === uploadingPlayerId ? { ...p, photo_url: url, isUploading: false } : p)
      })));
    } catch (err) {
      console.error(err);
      alert('Error al subir la foto');
      fetchTeams(); // Reload to reset state
    } finally {
      setUploadingPlayerId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openUploader = (playerId: string) => {
    setUploadingPlayerId(playerId);
    fileInputRef.current?.click();
  };

  const copyPublicLink = (teamId: string) => {
    const url = `${window.location.origin}/equipo/${teamId}`;
    navigator.clipboard.writeText(url);
    alert('¡Link público copiado al portapapeles!');
  };

  if (loading) return <div className="text-center p-10 text-slate-500 font-bold">Cargando equipos...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 pb-20">
      <Link to="/admin" className="inline-flex items-center gap-2 text-white hover:text-white/80 font-bold transition-colors drop-shadow-md">
        <ArrowLeft className="w-5 h-5" /> Volver al Panel
      </Link>
      
      <div className="flex justify-between items-center bg-white/95 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-2xl sm:text-3xl font-condensed font-bold text-sanatorio-blue flex items-center gap-3">
          <Users className="text-sanatorio-pink" /> Gestión de Equipos
        </h2>
      </div>

      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b-2 border-slate-200">
              <tr>
                <th className="p-3 sm:p-4 font-bold text-sanatorio-blue w-8 sm:w-10"></th>
                <th className="p-3 sm:p-4 font-bold text-sanatorio-blue text-sm sm:text-base">Equipo</th>
                <th className="p-4 font-bold text-sanatorio-blue hidden md:table-cell">Capitán</th>
                <th className="p-4 font-bold text-sanatorio-blue text-center hidden sm:table-cell">Jugadores</th>
                <th className="p-4 font-bold text-sanatorio-blue text-center hidden md:table-cell">M/V</th>
                <th className="p-3 sm:p-4 font-bold text-sanatorio-blue text-center text-sm sm:text-base">Estado</th>
                <th className="p-3 sm:p-4 font-bold text-sanatorio-blue text-center text-sm sm:text-base">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <React.Fragment key={team.id}>
                  <tr className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => toggleExpand(team.id)}>
                    <td className="p-3 sm:p-4 text-slate-400">
                      {expandedTeamId === team.id ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </td>
                    <td className="p-3 sm:p-4 font-bold text-slate-800 uppercase text-xs sm:text-base">
                      {team.name}
                      <div className="md:hidden text-xs text-slate-500 font-normal mt-1 space-y-0.5">
                        <div className="sm:hidden">{team.players?.length || 0} Jugadores</div>
                        <div>Cap: {team.captain_name}</div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 hidden md:table-cell">{team.captain_name}</td>
                    <td className="p-4 text-center font-bold hidden sm:table-cell">{team.players?.length || 0}</td>
                    <td className="p-4 text-center text-sm text-slate-500 hidden md:table-cell">
                      <span className="text-sanatorio-pink font-bold">{team.women_count}</span> / 
                      <span className="text-sanatorio-blue font-bold ml-1">{team.men_count}</span>
                    </td>
                    <td className="p-3 sm:p-4 text-center">
                      {team.status === 'pending' && <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 sm:px-3 rounded-full text-[10px] sm:text-xs font-bold"><Clock className="w-3 h-3 hidden sm:block" /> PEND</span>}
                      {team.status === 'active' && <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 sm:px-3 rounded-full text-[10px] sm:text-xs font-bold"><CheckCircle className="w-3 h-3 hidden sm:block" /> OK</span>}
                      {team.status === 'inactive' && <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 sm:px-3 rounded-full text-[10px] sm:text-xs font-bold"><XCircle className="w-3 h-3 hidden sm:block" /> NO</span>}
                    </td>
                    <td className="p-3 sm:p-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-1 sm:gap-2">
                        {team.status !== 'active' && (
                          <button onClick={() => updateStatus(team.id, 'active')} className="p-1.5 sm:p-2 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white rounded-lg transition-colors" title="Aprobar">
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        )}
                        {team.status !== 'inactive' && (
                          <button onClick={() => updateStatus(team.id, 'inactive')} className="p-1.5 sm:p-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-colors" title="Rechazar">
                            <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  
                  {expandedTeamId === team.id && (
                    <tr className="bg-slate-50/80 border-b-2 border-sanatorio-pink/20">
                      <td colSpan={7} className="p-2 sm:p-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                          <div className="bg-sanatorio-blue text-white px-4 py-3 font-bold text-sm uppercase flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" /> Jugadores de {team.name}
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => copyPublicLink(team.id)} 
                                className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs transition-colors"
                              >
                                <LinkIcon className="w-4 h-4" /> Link Público
                              </button>
                              <button onClick={() => openAddPlayer(team.id)} className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs transition-colors">
                                <Plus className="w-4 h-4" /> Añadir Jugador
                              </button>
                            </div>
                          </div>
                          
                          <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {team.players?.map((player: any) => (
                              <div key={player.id} className={`rounded-xl p-4 border flex flex-col gap-3 transition-colors relative group ${player.gender === 'M' ? 'bg-sanatorio-blue/5 border-sanatorio-blue/20 hover:border-sanatorio-blue/40' : 'bg-sanatorio-pink/5 border-sanatorio-pink/20 hover:border-sanatorio-pink/40'}`}>
                                
                                <div className="absolute top-3 right-3 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => openEditPlayer(player)} className="p-1.5 bg-white border border-slate-200 text-sanatorio-blue rounded-md shadow-sm hover:bg-slate-100" title="Editar">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleDeletePlayer(player.id)} className="p-1.5 bg-white border border-slate-200 text-red-500 rounded-md shadow-sm hover:bg-red-50" title="Eliminar">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="flex justify-between items-start pr-16">
                                  <div className="flex items-center gap-3">
                                    <div 
                                      onClick={() => openUploader(player.id)}
                                      className={`w-10 h-10 shrink-0 rounded-full border-2 ${player.photo_url ? 'border-sanatorio-pink' : 'border-slate-300 border-dashed'} overflow-hidden bg-white flex items-center justify-center cursor-pointer relative group/avatar`}
                                    >
                                      {player.isUploading ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                      ) : player.photo_url ? (
                                        <img src={player.photo_url} className="w-full h-full object-cover" />
                                      ) : (
                                        <User className={`w-5 h-5 ${player.gender === 'M' ? 'text-sanatorio-blue/60' : 'text-sanatorio-pink/60'}`} />
                                      )}
                                      <div className="absolute inset-0 bg-black/40 hidden group-hover/avatar:flex items-center justify-center">
                                        <Camera className="w-4 h-4 text-white" />
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <div className="font-bold text-slate-800">
                                        {player.full_name}
                                      </div>
                                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-2">
                                      <span>DNI: {player.dni || '-'}</span>
                                      <span>•</span>
                                      <span className={`px-2 py-0.5 rounded font-bold ${player.gender === 'F' ? 'bg-sanatorio-pink/10 text-sanatorio-pink' : 'bg-sanatorio-blue/10 text-sanatorio-blue'}`}>
                                        {player.gender === 'F' ? 'Fem' : 'Masc'}
                                      </span>
                                      <span>•</span>
                                      <span>Dorsal: {player.shirt_number || '-'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-200/60">
                                  <input 
                                    type="text" 
                                    placeholder="Apodo..."
                                    className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sanatorio-pink focus:border-sanatorio-pink outline-none transition-all w-full"
                                    value={nicknames[player.id] || ''}
                                    onChange={(e) => setNicknames({...nicknames, [player.id]: e.target.value})}
                                    onKeyDown={(e) => e.key === 'Enter' && saveNickname(player.id)}
                                  />
                                  <button 
                                    onClick={() => saveNickname(player.id)}
                                    disabled={savingNickname === player.id}
                                    className="p-2 bg-sanatorio-blue text-white rounded-lg hover:bg-sanatorio-blue/90 disabled:opacity-50 transition-colors shrink-0"
                                    title="Guardar Apodo"
                                  >
                                    {savingNickname === player.id ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>
                            ))}
                            {(!team.players || team.players.length === 0) && (
                              <div className="col-span-full p-4 text-center text-slate-500 text-sm">
                                Este equipo aún no tiene jugadores registrados.
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {teams.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">No hay equipos registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Player Modal Form */}
      {(editingPlayer || isAddingPlayerToTeam) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-lg text-sanatorio-blue">
                {editingPlayer ? 'Editar Jugador' : 'Añadir Nuevo Jugador'}
              </h3>
              <button onClick={closePlayerModal} className="text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input 
                  type="text" 
                  value={playerForm.full_name} 
                  onChange={(e) => setPlayerForm({...playerForm, full_name: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sanatorio-pink focus:border-sanatorio-pink outline-none"
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">DNI</label>
                  <input 
                    type="text" 
                    value={playerForm.dni} 
                    onChange={(e) => setPlayerForm({...playerForm, dni: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sanatorio-pink outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Dorsal</label>
                  <input 
                    type="text" 
                    value={playerForm.shirt_number} 
                    onChange={(e) => setPlayerForm({...playerForm, shirt_number: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sanatorio-pink outline-none"
                    placeholder="Ej: 10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Género</label>
                  <select 
                    value={playerForm.gender}
                    onChange={(e) => setPlayerForm({...playerForm, gender: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sanatorio-pink outline-none bg-white"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Apodo</label>
                  <input 
                    type="text" 
                    value={playerForm.nickname} 
                    onChange={(e) => setPlayerForm({...playerForm, nickname: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sanatorio-pink outline-none"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button 
                onClick={closePlayerModal}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSavePlayer}
                disabled={isSavingForm}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-sanatorio-blue hover:bg-sanatorio-blue/90 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isSavingForm ? <Clock className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input for Avatar Uploads */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
};
