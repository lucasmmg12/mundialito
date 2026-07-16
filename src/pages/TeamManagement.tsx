import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTeamById, getPlayersByTeam, uploadPlayerPhoto, updatePlayerPhotoUrl, addPlayerToTeam, removePlayer } from '../lib/mundialito-service';
import { Camera, Plus, Trash2, Loader2, Shield, X, AlertCircle } from 'lucide-react';

export function TeamManagement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New Player Form
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  
  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPlayerId, setUploadingPlayerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const teamData = await getTeamById(id);
        if (!teamData) {
          setError('Equipo no encontrado.');
          return;
        }
        setTeam(teamData);
        
        const playersData = await getPlayersByTeam(teamData.id);
        setPlayers(playersData || []);
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar la información del equipo.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    setIsSubmitting(true);
    try {
      const p = await addPlayerToTeam({
        team_id: team.id,
        full_name: newPlayerName,
        jersey_number: newPlayerNumber ? parseInt(newPlayerNumber, 10) : null
      });
      setPlayers([...players, p]);
      setNewPlayerName('');
      setNewPlayerNumber('');
    } catch (err) {
      console.error(err);
      alert('Error al agregar jugador');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar a este jugador?')) return;
    try {
      await removePlayer(playerId);
      setPlayers(players.filter(p => p.id !== playerId));
    } catch (err) {
      console.error(err);
      alert('Error al eliminar');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingPlayerId) return;
    
    try {
      // Simulate loading state for this specific player avatar
      setPlayers(players.map(p => p.id === uploadingPlayerId ? { ...p, isUploading: true } : p));
      
      const url = await uploadPlayerPhoto(file);
      await updatePlayerPhotoUrl(uploadingPlayerId, url);
      
      setPlayers(players.map(p => p.id === uploadingPlayerId ? { ...p, photo_url: url, isUploading: false } : p));
    } catch (err) {
      console.error(err);
      alert('Error al subir la foto');
      setPlayers(players.map(p => p.id === uploadingPlayerId ? { ...p, isUploading: false } : p));
    } finally {
      setUploadingPlayerId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openUploader = (playerId: string) => {
    setUploadingPlayerId(playerId);
    fileInputRef.current?.click();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-sanatorio-pink" /></div>;
  }

  if (error || !team) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl shadow-xl text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800">{error}</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 pt-8">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-sanatorio-blue to-[#1a4f8f] p-8 rounded-[32px] shadow-2xl text-white relative overflow-hidden mx-4 sm:mx-0">
        <div className="relative z-10">
          <h1 className="font-condensed font-bold text-3xl sm:text-4xl mb-2 tracking-wide uppercase">
            Perfil de Equipo
          </h1>
          <h2 className="text-xl font-medium text-sanatorio-pink mb-4">
            {team.name}
          </h2>
          <p className="text-white/80 max-w-xl text-sm sm:text-base">
            ¡Bienvenidos al perfil oficial de {team.name}! Haz clic en el círculo de tu jugador para subir tu foto de perfil, o ingresá a la Pizarra Táctica para armar la formación del próximo partido.
          </p>
        </div>
        <Shield className="absolute -right-4 -bottom-10 w-48 h-48 text-white/10 rotate-12" />
      </div>

      {/* Players List */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mx-4 sm:mx-0">
        <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
          <h3 className="font-condensed font-bold text-2xl text-slate-800 uppercase tracking-wide">
            Plantilla Actual
          </h3>
          <button 
            onClick={() => navigate('/pizarra')}
            className="bg-slate-100 text-sanatorio-blue font-bold px-6 py-2.5 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
          >
            Ir a Pizarra Táctica
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {players.map(player => (
              <div key={player.id} className="flex items-center p-4 rounded-2xl border border-slate-100 hover:border-sanatorio-pink/30 hover:shadow-md transition-all group bg-slate-50/50">
                
                {/* Avatar */}
                <div className="relative w-16 h-16 shrink-0">
                  <div 
                    onClick={() => player.photo_url ? setLightboxUrl(player.photo_url) : openUploader(player.id)}
                    className={`w-full h-full rounded-full border-2 ${player.photo_url ? 'border-sanatorio-pink cursor-zoom-in' : 'border-slate-300 border-dashed cursor-pointer'} overflow-hidden bg-white shadow-sm flex items-center justify-center`}
                  >
                    {player.isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    ) : player.photo_url ? (
                      <img src={player.photo_url} alt={player.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  {/* Botoncito para subir encima si ya tiene foto */}
                  {player.photo_url && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); openUploader(player.id); }}
                      className="absolute -bottom-1 -right-1 bg-sanatorio-blue text-white p-1.5 rounded-full shadow-lg hover:bg-[#1a4f8f] scale-0 group-hover:scale-100 transition-transform"
                      title="Cambiar Foto"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="ml-4 flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{player.full_name}</p>
                  <p className="text-sm text-slate-500">
                    Dorsal: {player.jersey_number || 'N/A'}
                  </p>
                </div>
                
                <button 
                  onClick={() => handleDeletePlayer(player.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  title="Eliminar Jugador"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Player */}
          <form onSubmit={handleAddPlayer} className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-sanatorio-pink" />
              Agregar Jugador
            </h4>
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                type="text" 
                placeholder="Nombre Completo" 
                value={newPlayerName}
                onChange={e => setNewPlayerName(e.target.value)}
                className="flex-1 bg-white border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-sanatorio-pink focus:border-sanatorio-pink block p-3 shadow-sm"
                required
              />
              <input 
                type="number" 
                placeholder="Dorsal" 
                value={newPlayerNumber}
                onChange={e => setNewPlayerNumber(e.target.value)}
                className="w-full sm:w-32 bg-white border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-sanatorio-pink focus:border-sanatorio-pink block p-3 shadow-sm"
              />
              <button 
                disabled={isSubmitting}
                className="bg-sanatorio-pink text-white font-bold px-6 py-3 rounded-xl hover:bg-[#d63d6f] transition-colors whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Agregar'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div 
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxUrl(null)}
        >
          <button className="absolute top-4 right-4 text-white hover:text-sanatorio-pink transition-colors">
            <X className="w-8 h-8" />
          </button>
          <img 
            src={lightboxUrl} 
            alt="Vista Ampliada" 
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" 
          />
        </div>
      )}
    </div>
  );
}
