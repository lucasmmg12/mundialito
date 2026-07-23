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
import { BarChart2, Image, Crosshair, Volume2, VolumeX, Trophy } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const AudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasUserInteracted = useRef(false);

  useEffect(() => {
    // Intentar autoplay
    const attemptPlay = async () => {
      try {
        if (audioRef.current) {
          audioRef.current.volume = 0.3; // Volumen suave
          await audioRef.current.play();
          setIsPlaying(true);
          hasUserInteracted.current = true;
        }
      } catch (err) {
        console.log("Autoplay prevenido por el navegador", err);
      }
    };
    
    attemptPlay();

    const handleFirstInteraction = () => {
      if (!hasUserInteracted.current && audioRef.current) {
        audioRef.current.volume = 0.3;
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          hasUserInteracted.current = true;
        }).catch(e => console.log("Error", e));
      }
      document.removeEventListener('click', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
    };
  }, []); // Run only once on mount

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir que suba al document si es la primera vez
    hasUserInteracted.current = true;
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.volume = 0.3;
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(e => console.error("Error playing audio", e));
      }
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
        <BarChart2 className="w-4 h-4" /> Inicio
      </Link>
      <Link to="/blog" className={`flex items-center gap-2 font-semibold transition-colors border-b-2 py-2 ${isActive('/blog')}`}>
        <Image className="w-4 h-4" /> Blog
      </Link>
      <Link to="/prode/auth" className={`flex items-center gap-2 font-semibold transition-colors border-b-2 py-2 ${isActive('/prode/auth')}`}>
        <Trophy className="w-4 h-4" /> Prode
      </Link>
      <Link to="/pizarra" className={`flex items-center gap-2 font-semibold transition-colors border-b-2 py-2 ${isActive('/pizarra')}`}>
        <Crosshair className="w-4 h-4" /> Pizarra Mágica
      </Link>
    </nav>
  );
};

const MobileBottomNav = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path 
      ? "text-sanatorio-pink" 
      : "text-slate-400 hover:text-slate-600";
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[60] pb-safe">
      <nav className="flex justify-around items-center h-16">
        <Link to="/" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/')}`}>
          <BarChart2 className="w-5 h-5" />
          <span className="text-[10px] font-bold">Inicio</span>
        </Link>
        <Link to="/blog" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/blog')}`}>
          <Image className="w-5 h-5" />
          <span className="text-[10px] font-bold">Blog</span>
        </Link>
        <Link to="/prode/auth" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/prode/auth')}`}>
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] font-bold">Prode</span>
        </Link>
        <Link to="/pizarra" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/pizarra')}`}>
          <Crosshair className="w-5 h-5" />
          <span className="text-[10px] font-bold">Pizarra</span>
        </Link>
      </nav>
    </div>
  );
};

import { AuthProvider } from './contexts/AuthContext';
import { ProdeAuth } from './pages/ProdeAuth';
import { ProdeDashboard } from './pages/ProdeDashboard';
import { ProdeLeaderboard } from './pages/ProdeLeaderboard';

function App() {
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
                <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <img 
                    src="/logosanatorio.png" 
                    alt="Sanatorio Argentino" 
                    className="h-10 w-auto object-contain"
                  />
                  <div className="h-10 w-px bg-slate-300 mx-2 hidden sm:block"></div>
                  <img 
                    src="/mundialito.jpeg" 
                    alt="Mundialito" 
                    className="h-12 w-auto object-contain rounded-full shadow-sm"
                  />
                  <div className="ml-2 flex flex-col">
                    <span className="font-condensed font-bold text-sanatorio-blue text-lg leading-tight">
                      MUNDIALITO MIXTO 2026
                    </span>
                    <span className="text-[10px] text-sanatorio-pink font-semibold uppercase tracking-wider">
                      Sistema de Gestión
                    </span>
                  </div>
                </Link>

                {/* Desktop Navigation */}
                <Navigation />

              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="w-full px-4 sm:px-6 lg:px-8 py-8 relative z-10 pb-24 md:pb-8">
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
          
          {/* Mobile Bottom Navigation */}
          <MobileBottomNav />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
