import React, { useState, useEffect, useRef } from 'react';
import { getTeams, getPlayersByTeam } from '../lib/mundialito-service';
import { Shield, User, Loader2, ChevronDown, Pen, Eraser, Move } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

export function TacticalBoard() {
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Store player positions (if they are on the pitch)
  const [positions, setPositions] = useState<Record<string, Position>>({});
  const [activeTouchId, setActiveTouchId] = useState<string | null>(null);
  
  const pitchRef = useRef<HTMLDivElement>(null);

  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingMode) return;
    // Don't preventDefault unconditionally on touch start or it breaks scrolling,
    // but in canvas area it's fine because touch-action: none is on the container
    isDrawing.current = true;
    lastPos.current = getCoordinates(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingMode || !isDrawing.current || !canvasRef.current) return;
    if (e.cancelable) e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const newPos = getCoordinates(e);
    
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(newPos.x, newPos.y);
    ctx.strokeStyle = '#f89b29';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    lastPos.current = newPos;
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && pitchRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        const imgData = ctx?.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        canvasRef.current.width = pitchRef.current.clientWidth;
        canvasRef.current.height = pitchRef.current.clientHeight;
        
        if (imgData && ctx) ctx.putImageData(imgData, 0, 0);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [loading, selectedTeamId]);

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const [isBenchOpen, setIsBenchOpen] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await getTeams();
        setTeams(data || []);
        if (data && data.length > 0) {
          setSelectedTeamId(data[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  useEffect(() => {
    const fetchPlayers = async () => {
      if (!selectedTeamId) return;
      try {
        const data = await getPlayersByTeam(selectedTeamId);
        setPlayers(data || []);
        setPositions({}); // Reset positions on team change
      } catch (err) {
        console.error(err);
      }
    };
    fetchPlayers();
  }, [selectedTeamId]);

  const handleDragStart = (e: React.DragEvent, playerId: string) => {
    e.dataTransfer.setData('text/plain', playerId);
  };

  const handleDragEnd = () => {
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // allow drop
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const playerId = e.dataTransfer.getData('text/plain');
    if (!playerId || !pitchRef.current) return;

    const rect = pitchRef.current.getBoundingClientRect();
    // Calculate percentage position so it's responsive
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Constrain to 0-100%
    const constrainedX = Math.max(0, Math.min(100, x));
    const constrainedY = Math.max(0, Math.min(100, y));

    setPositions(prev => ({
      ...prev,
      [playerId]: { x: constrainedX, y: constrainedY }
    }));
  };

  const handleBenchPlayerClick = (playerId: string) => {
    if (!positions[playerId]) {
      setPositions(prev => ({
        ...prev,
        [playerId]: { x: 50, y: 50 }
      }));
    }
  };

  const handleTouchStart = (_e: React.TouchEvent, playerId: string) => {
    setActiveTouchId(playerId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!activeTouchId || !pitchRef.current) return;
    
    const touch = e.touches[0];
    const rect = pitchRef.current.getBoundingClientRect();
    
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;

    const constrainedX = Math.max(0, Math.min(100, x));
    const constrainedY = Math.max(0, Math.min(100, y));

    setPositions(prev => ({
      ...prev,
      [activeTouchId]: { x: constrainedX, y: constrainedY }
    }));
  };

  const handleTouchEnd = () => {
    setActiveTouchId(null);
  };

  const handleRemoveFromPitch = (playerId: string) => {
    setPositions(prev => {
      const newPos = { ...prev };
      delete newPos[playerId];
      return newPos;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-sanatorio-pink" />
      </div>
    );
  }

  // Separar jugadores en el banco vs en la cancha
  const benchPlayers = players.filter(p => !positions[p.id]);
  const pitchPlayers = players.filter(p => positions[p.id]);

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
      
      {/* Sidebar - Banquillo */}
      <div className="w-full lg:w-1/3 bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/40 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-sanatorio-pink" />
            Pizarra Táctica
          </h2>
          <button 
            onClick={() => setIsBenchOpen(!isBenchOpen)}
            className="lg:hidden p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <ChevronDown className={`w-5 h-5 transition-transform ${isBenchOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className={`${isBenchOpen ? 'block' : 'hidden'} lg:block flex-col flex-1`}>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wider">
              Seleccionar Equipo
            </label>
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-sanatorio-pink focus:border-sanatorio-pink flex items-center justify-between p-3 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-3">
                {teams.find(t => t.id === selectedTeamId)?.logo_url ? (
                  <img 
                    src={teams.find(t => t.id === selectedTeamId)?.logo_url} 
                    alt={teams.find(t => t.id === selectedTeamId)?.name} 
                    className="w-6 h-6 rounded-full object-cover shadow-sm bg-white" 
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">?</div>
                )}
                <span className="font-semibold">{teams.find(t => t.id === selectedTeamId)?.name || 'Seleccionar Equipo'}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                  {teams.map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTeamId(t.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors ${selectedTeamId === t.id ? 'bg-sanatorio-pink/5' : ''}`}
                    >
                      {t.logo_url ? (
                        <img 
                          src={t.logo_url} 
                          alt={t.name} 
                          className="w-6 h-6 rounded-full object-cover shadow-sm bg-white" 
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">?</div>
                      )}
                      <span className={`font-semibold ${selectedTeamId === t.id ? 'text-sanatorio-pink' : 'text-slate-700'}`}>
                        {t.name}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider flex items-center justify-between">
            <span>Banquillo</span>
            <span className="bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full text-xs">{benchPlayers.length}</span>
          </h3>
          <p className="text-xs text-sanatorio-pink mb-3 font-medium lg:hidden">
            Toca un jugador para agregarlo a la cancha
          </p>
          
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {benchPlayers.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Todos en la cancha</p>
            ) : (
              benchPlayers.map(player => (
                <div 
                  key={player.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, player.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleBenchPlayerClick(player.id)}
                  className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:border-sanatorio-pink hover:shadow-md transition-all flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shadow-inner group-hover:bg-sanatorio-pink group-hover:text-white transition-colors">
                    {player.jersey_number || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{player.full_name || player.name}</p>
                    <p className="text-xs text-slate-500 truncate">{player.position || 'Jugador'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Main Area - Cancha */}
      <div className="w-full lg:w-2/3 flex flex-col">
        {/* Herramientas de dibujo */}
        <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-2xl p-3 shadow-md border border-white/40 mb-4 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setIsDrawingMode(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${!isDrawingMode ? 'bg-sanatorio-blue text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <Move className="w-4 h-4" /> Mover
            </button>
            <button 
              onClick={() => setIsDrawingMode(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${isDrawingMode ? 'bg-sanatorio-pink text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <Pen className="w-4 h-4" /> Dibujar
            </button>
          </div>
          <button 
            onClick={clearCanvas}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
          >
            <Eraser className="w-4 h-4" /> Limpiar
          </button>
        </div>

        <div className="bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border-4 border-white/20 relative aspect-[3/4] sm:aspect-video w-full touch-none"
             ref={pitchRef}
             onDragOver={!isDrawingMode ? handleDragOver : undefined}
             onDrop={!isDrawingMode ? handleDrop : undefined}
             onTouchMove={!isDrawingMode ? handleTouchMove : draw}
             onTouchEnd={!isDrawingMode ? handleTouchEnd : stopDrawing}
             onTouchCancel={!isDrawingMode ? handleTouchEnd : stopDrawing}
             onMouseMove={isDrawingMode ? draw : undefined}
             onMouseUp={isDrawingMode ? stopDrawing : undefined}
             onMouseLeave={isDrawingMode ? stopDrawing : undefined}
        >
          {/* Fondo de Cancha (Fútbol 5) */}
          <div className="absolute inset-0 bg-green-600/90" style={{ 
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(0,0,0,0.05) 40px, rgba(0,0,0,0.05) 80px)'
          }}>
            {/* Líneas de la cancha */}
            <div className="absolute inset-4 border-2 border-white/60"></div>
            {/* Medio campo */}
            <div className="absolute top-1/2 left-4 right-4 h-0 border-t-2 border-white/60"></div>
            <div className="absolute top-1/2 left-1/2 w-24 h-24 -mt-12 -ml-12 border-2 border-white/60 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 w-2 h-2 -mt-1 -ml-1 bg-white/60 rounded-full"></div>
            
            {/* Áreas */}
            <div className="absolute top-4 left-1/2 w-48 h-24 -ml-24 border-2 border-t-0 border-white/60"></div>
            <div className="absolute bottom-4 left-1/2 w-48 h-24 -ml-24 border-2 border-b-0 border-white/60"></div>
          </div>

          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full ${isDrawingMode ? 'z-20 cursor-crosshair' : 'z-0 pointer-events-none'}`}
            onMouseDown={isDrawingMode ? startDrawing : undefined}
            onTouchStart={isDrawingMode ? startDrawing : undefined}
          />

          {/* Jugadores en Cancha */}
          {pitchPlayers.map(player => {
            const pos = positions[player.id];
            if (!pos) return null;
            
            return (
              <div 
                key={player.id}
                draggable={!isDrawingMode}
                onDragStart={!isDrawingMode ? (e) => handleDragStart(e, player.id) : undefined}
                onDragEnd={!isDrawingMode ? handleDragEnd : undefined}
                onDoubleClick={() => handleRemoveFromPitch(player.id)}
                onTouchStart={!isDrawingMode ? (e) => handleTouchStart(e, player.id) : undefined}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${!isDrawingMode ? 'cursor-grab active:cursor-grabbing' : ''} group/player z-10 flex flex-col items-center`}
                style={{ left: `${pos.x}%`, top: `${pos.y}%`, touchAction: 'none' }}
              >
                {/* Botón X mobile y desktop hover */}
                <button 
                  onClick={(e) => { e.stopPropagation(); handleRemoveFromPitch(player.id); }}
                  onTouchEnd={(e) => { e.stopPropagation(); handleRemoveFromPitch(player.id); }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[12px] opacity-100 sm:opacity-0 sm:group-hover/player:opacity-100 transition-opacity z-20 shadow-md font-bold"
                >
                  ×
                </button>
                {/* Ficha */}
                <div className="w-10 h-10 rounded-full bg-white border-2 border-sanatorio-pink shadow-lg flex items-center justify-center font-bold text-slate-800 text-sm group-hover/player:scale-110 transition-transform">
                  {player.jersey_number || '?'}
                </div>
                {/* Nombre (tooltip/label) */}
                <div className="mt-1 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm backdrop-blur-sm pointer-events-none opacity-80 group-hover/player:opacity-100 transition-opacity">
                  {player.full_name?.split(' ')[0] || player.name?.split(' ')[0]}
                </div>
              </div>
            );
          })}
          
          {/* Instructions Overlay if empty */}
          {pitchPlayers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/40 backdrop-blur-sm text-white px-6 py-3 rounded-2xl font-semibold tracking-wide flex items-center gap-2">
                <User className="w-5 h-5" />
                Arrastra jugadores aquí
              </div>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-slate-500 mt-4 font-medium uppercase tracking-widest">
          Tip: Doble clic en un jugador para devolverlo al banquillo
        </p>
      </div>

    </div>
  );
}
