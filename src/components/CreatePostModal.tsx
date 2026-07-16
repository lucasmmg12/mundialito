import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, AlertTriangle, Loader2 } from 'lucide-react';
import { uploadBlogMedia, createEventPost } from '../lib/mundialito-service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export function CreatePostModal({ isOpen, onClose, onPostCreated }: Props) {
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (files.length + newFiles.length > 5) {
        setError('Puedes subir un máximo de 5 fotos.');
        return;
      }
      setFiles(prev => [...prev, ...newFiles]);
      setError('');
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && files.length === 0) {
      setError('Debes escribir algo o subir al menos una foto.');
      return;
    }
    if (!acceptedRules) {
      setError('Debes aceptar las reglas de convivencia.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      // Upload files first
      const imageUrls = await Promise.all(
        files.map(file => uploadBlogMedia(file))
      );

      // Create post
      await createEventPost({
        author_name: authorName.trim() || 'Anónimo',
        content: content.trim(),
        image_urls: imageUrls,
      });

      onPostCreated();
      onClose();
      // Reset state
      setAuthorName('');
      setContent('');
      setFiles([]);
      setAcceptedRules(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al publicar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Nuevo Post</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Alerta de Reglas (Importante para QOAG) */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-800">Reglas de Convivencia</h4>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                Está estrictamente prohibido compartir contenido sensible, hiriente, discriminatorio o inapropiado. 
                Todo el material es público y las infracciones resultarán en el bloqueo del acceso.
              </p>
            </div>
          </div>

          <div>
            <input 
              type="text" 
              placeholder="Tu nombre (opcional)" 
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full border-b border-slate-200 pb-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sanatorio-pink transition-colors bg-transparent"
            />
          </div>

          <div>
            <textarea
              placeholder="¿Qué quieres compartir sobre el Mundialito?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[100px] border-none text-slate-800 placeholder-slate-400 focus:ring-0 resize-none bg-transparent"
              rows={4}
            />
          </div>

          {/* Previsualización de Fotos */}
          {files.length > 0 && (
            <div className="flex gap-2 overflow-x-auto py-2">
              {files.map((file, i) => (
                <div key={i} className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-slate-200">
                  <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="rules" 
              checked={acceptedRules}
              onChange={(e) => setAcceptedRules(e.target.checked)}
              className="rounded border-slate-300 text-sanatorio-pink focus:ring-sanatorio-pink"
            />
            <label htmlFor="rules" className="text-xs text-slate-600 font-medium">
              He leído las reglas y mi contenido es apropiado.
            </label>
          </div>

        </form>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-slate-500 hover:text-sanatorio-pink transition-colors px-3 py-2 rounded-lg hover:bg-sanatorio-pink/10 font-medium text-sm"
          >
            <ImageIcon className="w-5 h-5" />
            <span>Agregar fotos ({files.length}/5)</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            accept="image/*"
            multiple 
          />

          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !acceptedRules}
            className="bg-sanatorio-pink text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Publicando...</>
            ) : (
              'Publicar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
