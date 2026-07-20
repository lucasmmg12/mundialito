import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { FootballBackground } from './components/FootballBackground';
import { PublicRegistration } from './pages/PublicRegistration';
import { PublicDashboard } from './pages/PublicDashboard';
import { PublicRules } from './pages/PublicRules';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminTeams } from './pages/admin/AdminTeams';
import { AdminMatches } from './pages/admin/AdminMatches';
import { PublicBlog } from './pages/PublicBlog';
import { TacticalBoard } from './pages/TacticalBoard';
import { TeamManagement } from './pages/TeamManagement';
import { BarChart2, Shield, Image, Crosshair, Users, Menu, X, Volume2, VolumeX, Trophy } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const AudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Intentar autoplay
    const attemptPlay = async () => {
      try {
        if (audioRef.current) {
          audioRef.current.volume = 0.3; // Volumen suave
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } catch (err) {
        console.log("Autoplay prevenido por el navegador", err);
      }
    };
    
    attemptPlay();
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[100]">
      <audio 
        ref={audioRef} 
        src="/videoplayback.weba" 
        loop 
      />
      <button 
        onClick={togglePlay}
        className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-sanatorio-blue hover:text-sanatorio-pink transition-all border border-slate-200 hover:scale-105"
        title={isPlaying ? "Silenciar música" : "Reproducir música"}
      >
        {isPlaying ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
      </button>
    </div>
  );
};

const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path 
      ? "text-sanatorio-pink border-sanatorio-pink" 
      : "text-slate-600 border-transparent hover:text-sanatorio-pink hover:border-sanatorio-pink";
  };

  return (
    <nav className="hidden md:flex space-x-6">
      <Link to="/" className={`flex items-center gap-2 font-semibold transition-colors border-b-2 py-2 ${isActive('/')}`}>
        <BarChart2 className="w-4 h-4" /> Inicio / Estadísticas
      </Link>
      <Link to="/inscripcion" className={`flex items-center gap-2 font-semibold transition-colors border-b-2 py-2 ${isActive('/inscripcion')}`}>
        <Users className="w-4 h-4" /> Inscripción de Equipo
      </Link>
      <Link to="/admin" className={`flex items-center gap-2 font-semibold transition-colors border-b-2 py-2 ${isActive('/admin')}`}>
        <Shield className="w-4 h-4" /> Administración
      </Link>
      <Link to="/blog" className={`flex items-center gap-2 font-semibold transition-colors border-b-2 py-2 ${isActive('/blog')}`}>
        <Image className="w-4 h-4" /> Blog del Evento
      </Link>
      <Link to="/prode/auth" className={`flex items-center gap-2 font-semibold transition-colors border-b-2 py-2 ${isActive('/prode/auth')}`}>
        <Trophy className="w-4 h-4" /> Prode
      </Link>
      <Link to="/pizarra" className={`flex items-center gap-2 font-semibold transition-colors border-b-2 py-2 ${isActive('/pizarra')}`}>
        <Crosshair className="w-4 h-4" /> Pizarra Táctica
      </Link>
    </nav>
  );
};

import { AuthProvider } from './contexts/AuthContext';
import { ProdeAuth } from './pages/ProdeAuth';
import { ProdeDashboard } from './pages/ProdeDashboard';
import { ProdeLeaderboard } from './pages/ProdeLeaderboard';

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen font-sans relative">
          <FootballBackground />
          
          {/* Navbar / Top Header */}
          <header className="bg-gradient-to-r from-white/95 via-white/80 to-transparent sticky top-0 z-50 border-b border-white/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-20 items-center">
                {/* Logos */}
                <div className="flex items-center gap-3">
                  <img 
                    src="@logosanatorio" 
                    alt="Sanatorio Argentino" 
                    className="h-10 w-auto object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x50?text=Sanatorio+Argentino';
                    }}
                  />
                  <div className="h-10 w-px bg-slate-300 mx-2 hidden sm:block"></div>
                  <img 
                    src="/mundialito.jpeg" 
                    alt="Mundialito" 
                    className="h-12 w-auto object-contain rounded-full shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50?text=Logo';
                    }}
                  />
                  <div className="ml-2 flex flex-col">
                    <span className="font-condensed font-bold text-sanatorio-blue text-lg leading-tight">
                      MUNDIALITO MIXTO 2026
                    </span>
                    <span className="text-[10px] text-sanatorio-pink font-semibold uppercase tracking-wider">
                      Sistema de Gestión
                    </span>
                  </div>
                </div>

                {/* Desktop Navigation */}
                <Navigation />

                {/* Mobile Menu Button */}
                <button 
                  className="md:hidden p-2 text-slate-600 hover:text-sanatorio-pink transition-colors"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            </div>
          </header>

          {/* Mobile Navigation Drawer */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-[60] flex">
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              {/* Drawer */}
              <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl animate-in slide-in-from-right duration-300 ml-auto h-full overflow-y-auto">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-condensed font-bold text-sanatorio-blue text-lg">MENÚ</span>
                  <button 
                    className="p-2 text-slate-400 hover:text-sanatorio-pink transition-colors rounded-full hover:bg-slate-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="flex-1 px-2 py-4 space-y-2">
                  <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-sanatorio-pink/10 hover:text-sanatorio-pink">
                    <BarChart2 className="w-5 h-5" /> Inicio / Estadísticas
                  </Link>
                  <Link to="/inscripcion" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-sanatorio-pink/10 hover:text-sanatorio-pink">
                    <Users className="w-5 h-5" /> Inscripción de Equipo
                  </Link>
                  <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-sanatorio-pink/10 hover:text-sanatorio-pink">
                    <Shield className="w-5 h-5" /> Administración
                  </Link>
                  <Link to="/blog" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-sanatorio-pink/10 hover:text-sanatorio-pink">
                    <Image className="w-5 h-5" /> Blog del Evento
                  </Link>
                  <Link to="/prode/auth" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-sanatorio-pink/10 hover:text-sanatorio-pink">
                    <Trophy className="w-5 h-5" /> Prode
                  </Link>
                  <Link to="/pizarra" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-sanatorio-pink/10 hover:text-sanatorio-pink">
                    <Crosshair className="w-5 h-5" /> Pizarra Táctica
                  </Link>
                </nav>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <main className="w-full px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            <Routes>
              <Route path="/" element={<PublicDashboard />} />
              <Route path="/inscripcion" element={<PublicRegistration />} />
              <Route path="/equipo/:id" element={<TeamManagement />} />
              <Route path="/reglamento" element={<PublicRules />} />
              <Route path="/blog" element={<PublicBlog />} />
              <Route path="/pizarra" element={<TacticalBoard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/equipos" element={<AdminTeams />} />
              <Route path="/admin/partidos" element={<AdminMatches />} />
              <Route path="/prode/auth" element={<ProdeAuth />} />
              <Route path="/prode" element={<ProdeDashboard />} />
              <Route path="/prode/ranking" element={<ProdeLeaderboard />} />
            </Routes>
          </main>
          
          {/* Global Audio Player */}
          <AudioPlayer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
