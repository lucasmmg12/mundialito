import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Trophy, Upload, AlertCircle } from 'lucide-react';
import { Team } from '../lib/mundialito-service';

export const ProdeAuth = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [teamId, setTeamId] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [avatar, setAvatar] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session) {
      navigate('/prode');
    }
  }, [session, navigate]);

  useEffect(() => {
    if (!isLogin) {
      const fetchTeams = async () => {
        const { data } = await supabase.from('teams').select('*').order('name');
        if (data) setTeams(data);
      };
      fetchTeams();
    }
  }, [isLogin]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        // Sign Up
        const { data: authData, error: authError } = await supabase.auth.signUp({ 
          email, 
          password 
        });
        if (authError) throw authError;

        if (authData.user) {
          let avatarUrl = '';
          
          if (avatar) {
            const fileExt = avatar.name.split('.').pop();
            const filePath = `${authData.user.id}/avatar.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(filePath, avatar);
              
            if (!uploadError) {
              const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
              avatarUrl = data.publicUrl;
            } else {
              console.error("Error uploading avatar:", uploadError);
            }
          }

          // Insert Profile
          const { error: profileError } = await supabase.from('profiles').insert([
            {
              id: authData.user.id,
              full_name: fullName,
              team_id: teamId || null,
              avatar_url: avatarUrl
            }
          ]);

          if (profileError) throw profileError;
        }
      }
    } catch (err: any) {
      setError(err.message || "Ha ocurrido un error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-white/40">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-sanatorio-blue/10 flex items-center justify-center rounded-2xl mb-4">
            <Trophy className="h-8 w-8 text-sanatorio-blue" />
          </div>
          <h2 className="text-3xl font-condensed font-bold text-slate-800">
            {isLogin ? 'Ingresar al Prode' : 'Registro del Prode'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {isLogin ? 'Participa y suma puntos' : 'Crea tu cuenta para pronosticar los partidos'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sanatorio-blue focus:border-sanatorio-blue transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tu Equipo</label>
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sanatorio-blue focus:border-sanatorio-blue transition-colors"
                  >
                    <option value="">(Sin equipo / Espectador)</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Foto de Perfil</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500 font-semibold">
                        {avatar ? avatar.name : 'Haz clic para subir una foto'}
                      </p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  </label>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sanatorio-blue focus:border-sanatorio-blue transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sanatorio-blue focus:border-sanatorio-blue transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-sanatorio-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sanatorio-blue transition-all disabled:opacity-50"
          >
            {loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarme')}
          </button>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-sanatorio-pink hover:text-pink-700 font-semibold transition-colors"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
