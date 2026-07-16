import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Onboarding = ({ onComplete }: { onComplete: () => void }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [liked, setLiked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleEnter = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 600);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center bg-slate-900/95 backdrop-blur-sm overflow-y-auto transition-all duration-700 ease-in-out py-8 sm:py-12 ${isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      
      {/* Content overlay */}
      <div className={`relative z-10 w-full max-w-md mx-auto p-4 transition-all duration-1000 transform flex flex-col gap-6 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
        
        {/* Instagram style post */}
        <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 shrink-0">
          
          {/* Post Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-sanatorio-pink to-purple-500 p-[2px]">
                <img src="/logosanatorio.png" alt="Sanatorio Argentino" className="w-full h-full rounded-full border-2 border-white object-cover bg-white" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm leading-tight">sanatorioargentino</p>
                <p className="text-xs text-slate-500">Mundialito 2026</p>
              </div>
            </div>
            <MoreHorizontal className="w-5 h-5 text-slate-500" />
          </div>

          {/* Post Image */}
          <div className="relative aspect-square w-full bg-slate-100 overflow-hidden group">
            <img 
              src="/Messi_as_doctor_playing_football_202607151050.jpeg" 
              alt="Mundialito 2026" 
              className="w-full h-full object-cover"
              onDoubleClick={() => setLiked(true)}
            />
            {liked && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-pulse">
                 <Heart className="w-24 h-24 text-white fill-white drop-shadow-xl" />
              </div>
            )}
          </div>

          {/* Post Actions */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <button onClick={() => setLiked(!liked)} className="transition-transform active:scale-75">
                  <Heart className={`w-7 h-7 ${liked ? 'fill-red-500 text-red-500' : 'text-slate-800'}`} />
                </button>
                <MessageCircle className="w-7 h-7 text-slate-800 hover:text-slate-500 transition-colors cursor-pointer" />
                <Send className="w-7 h-7 text-slate-800 hover:text-slate-500 transition-colors cursor-pointer" />
              </div>
              <Bookmark className="w-7 h-7 text-slate-800 hover:text-slate-500 transition-colors cursor-pointer" />
            </div>

            <p className="font-bold text-slate-800 text-sm mb-2">Le gusta a 1,542 personas</p>

            <div className="text-sm text-slate-800 mb-2">
              <span className="font-bold mr-2">sanatorioargentino</span>
              ¡Bienvenidos al Mundialito Mixto 2026! 🏆 
              <br/><br/>
              Los invitamos a disfrutar de un día hermoso en el cual podremos disfrutar con nuestros compañeros de trabajo y también con nuestros hijos. ¡A jugar! ⚽❤️
            </div>
            
            <p className="text-xs text-slate-400 uppercase tracking-wide mt-2">Hace 2 horas</p>
          </div>
        </div>

        {/* Second Post (Video) */}
        <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 shrink-0">
          {/* Post Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-sanatorio-pink to-purple-500 p-[2px]">
                <img src="/logosanatorio.png" alt="Sanatorio Argentino" className="w-full h-full rounded-full border-2 border-white object-cover bg-white" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm leading-tight">sanatorioargentino</p>
                <p className="text-xs text-slate-500">Reglamento 2026</p>
              </div>
            </div>
            <MoreHorizontal className="w-5 h-5 text-slate-500" />
          </div>

          {/* Post Video */}
          <div className="relative aspect-square sm:aspect-video w-full bg-slate-100 overflow-hidden group flex items-center justify-center">
            <video 
              src="/Girls_playing_soccer_in_fields_202607141441.mp4" 
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          </div>

          {/* Post Actions */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <button className="transition-transform active:scale-75">
                  <Heart className="w-7 h-7 text-slate-800" />
                </button>
                <MessageCircle className="w-7 h-7 text-slate-800 hover:text-slate-500 transition-colors cursor-pointer" />
                <Send className="w-7 h-7 text-slate-800 hover:text-slate-500 transition-colors cursor-pointer" />
              </div>
              <Bookmark className="w-7 h-7 text-slate-800 hover:text-slate-500 transition-colors cursor-pointer" />
            </div>

            <p className="font-bold text-slate-800 text-sm mb-2">Le gusta a 983 personas</p>

            <div className="text-sm text-slate-800 mb-4">
              <span className="font-bold mr-2">sanatorioargentino</span>
              ¿Ya leíste el reglamento del torneo? 📜 
              <br/><br/>
              Asegurate de conocer todas las reglas y cómo se va a desarrollar el Mundialito Mixto 2026.
            </div>
            
            <button
              onClick={() => {
                navigate('/reglamento');
                handleEnter();
              }}
              className="w-full py-3 bg-slate-100 text-sanatorio-blue font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Ir al Reglamento
            </button>

            <p className="text-xs text-slate-400 uppercase tracking-wide mt-4">Hace 1 hora</p>
          </div>
        </div>

        {/* Third Post (Pizarra) */}
        <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 shrink-0">
          {/* Post Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-sanatorio-pink to-purple-500 p-[2px]">
                <img src="/logosanatorio.png" alt="Sanatorio Argentino" className="w-full h-full rounded-full border-2 border-white object-cover bg-white" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm leading-tight">sanatorioargentino</p>
                <p className="text-xs text-slate-500">Pizarra Táctica</p>
              </div>
            </div>
            <MoreHorizontal className="w-5 h-5 text-slate-500" />
          </div>

          {/* Post Image */}
          <div className="relative aspect-square sm:aspect-video w-full bg-slate-100 overflow-hidden group flex items-center justify-center">
            <img 
              src="/pizarra.jpg" 
              alt="Pizarra Táctica" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Post Actions */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <button className="transition-transform active:scale-75">
                  <Heart className="w-7 h-7 text-slate-800" />
                </button>
                <MessageCircle className="w-7 h-7 text-slate-800 hover:text-slate-500 transition-colors cursor-pointer" />
                <Send className="w-7 h-7 text-slate-800 hover:text-slate-500 transition-colors cursor-pointer" />
              </div>
              <Bookmark className="w-7 h-7 text-slate-800 hover:text-slate-500 transition-colors cursor-pointer" />
            </div>

            <p className="font-bold text-slate-800 text-sm mb-2">Le gusta a 745 personas</p>

            <div className="text-sm text-slate-800 mb-4">
              <span className="font-bold mr-2">sanatorioargentino</span>
              ¡Planificá tu estrategia para el Mundialito! 📋⚽ 
              <br/><br/>
              ¿Querés organizar la formación de tu equipo? Usá nuestra Pizarra Táctica interactiva. Vas a poder elegir a los jugadores, arrastrarlos a la cancha para armar diferentes tácticas o esquemas, y así planear la mejor estrategia. ¡Convertite en el DT de tu equipo!
            </div>
            
            <button
              onClick={() => {
                navigate('/pizarra');
                handleEnter();
              }}
              className="w-full py-3 bg-slate-100 text-sanatorio-blue font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Probar Pizarra Táctica
            </button>

            <p className="text-xs text-slate-400 uppercase tracking-wide mt-4">Hace 30 minutos</p>
          </div>
        </div>

        {/* Enter Button */}
        <button 
          onClick={handleEnter}
          className="mt-2 w-full py-4 bg-sanatorio-blue text-white font-bold text-lg rounded-2xl shadow-lg hover:bg-[#1a4f8f] hover:scale-[1.02] transition-all duration-300 shrink-0"
        >
          Ingresar al Portal
        </button>

      </div>
    </div>
  );
};
