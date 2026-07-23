import { useState, useEffect } from 'react';
import { getEventPosts } from '../lib/mundialito-service';
import type { EventPost } from '../lib/mundialito-service';
import { CreatePostModal } from '../components/CreatePostModal';
import { Camera, Plus, MessageCircle, Heart, UserCircle2 } from 'lucide-react';

export function PublicBlog() {
  const [posts, setPosts] = useState<EventPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await getEventPosts();
      setPosts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="max-w-2xl mx-auto pb-24 relative min-h-screen">
      
      {/* Header Visual */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/40 mb-8 text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-sanatorio-pink/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-sanatorio-blue/10 rounded-full blur-3xl"></div>
        
        <div className="w-16 h-16 bg-gradient-to-tr from-sanatorio-pink to-orange-400 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg rotate-3">
          <Camera className="w-8 h-8 text-white -rotate-3" />
        </div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Blog del Mundialito</h1>
        <p className="text-sm text-slate-500 font-medium mt-2 max-w-md mx-auto">
          Comparte los mejores momentos del torneo. Sube tus fotos, comenta los partidos y vive la pasión del fútbol 5.
        </p>
      </div>

      {/* Feed de Posts */}
      <div className="space-y-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-sanatorio-pink border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-3xl border border-white">
            <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Aún no hay publicaciones.</p>
            <p className="text-xs text-slate-400 mt-1">¡Sé el primero en compartir algo!</p>
          </div>
        ) : (
          posts.map(post => (
            <article key={post.id} className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              
              {/* Post Header */}
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center border border-slate-200 shrink-0">
                  <UserCircle2 className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm leading-none">{post.author_name || 'Anónimo'}</h3>
                  <span className="text-xs text-slate-500 font-medium">{formatDate(post.created_at)}</span>
                </div>
              </div>

              {/* Imagen (si hay, mostramos la primera por ahora o un grid simple) */}
              {post.image_urls && post.image_urls.length > 0 && (
                <div className={`grid gap-0.5 ${post.image_urls.length === 1 ? 'grid-cols-1' : post.image_urls.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                  {post.image_urls.slice(0, 4).map((url, i) => (
                    <div key={i} className={`relative bg-slate-100 ${post.image_urls.length === 3 && i === 0 ? 'col-span-2' : ''} ${post.image_urls.length === 1 ? 'aspect-square' : 'aspect-square'}`}>
                      <img src={url} alt="Post media" className="w-full h-full object-cover" loading="lazy" />
                      {/* Indicador de más fotos si hay 5 */}
                      {i === 3 && post.image_urls.length > 4 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                          <span className="text-white font-bold text-xl">+{post.image_urls.length - 4}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Contenido / Caption */}
              <div className="p-5">
                <div className="flex gap-4 mb-4">
                  <button className="text-slate-400 hover:text-sanatorio-pink transition-colors">
                    <Heart className="w-6 h-6" />
                  </button>
                  <button className="text-slate-400 hover:text-sanatorio-blue transition-colors">
                    <MessageCircle className="w-6 h-6" />
                  </button>
                </div>
                {post.content && (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    <span className="font-bold mr-2 text-slate-800">{post.author_name || 'Anónimo'}</span>
                    {post.content}
                  </p>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 md:bottom-12 right-4 md:right-8 z-40 bg-sanatorio-pink text-white w-14 h-14 rounded-full shadow-2xl shadow-pink-500/40 flex items-center justify-center hover:bg-pink-600 hover:scale-105 transition-all duration-300"
      >
        <Plus className="w-6 h-6" />
      </button>

      <CreatePostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onPostCreated={loadPosts} 
      />
    </div>
  );
}
