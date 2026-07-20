import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, LogOut, Users, Activity, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setError(error.message);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return <div className="text-center p-10">Cargando...</div>;

  if (!session) {
    return (
      <div className="max-w-md mx-auto bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-100 overflow-hidden mt-20 p-8">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-sanatorio-blue/10 rounded-full mb-4">
            <Lock className="w-8 h-8 text-sanatorio-blue" />
          </div>
          <h2 className="text-3xl font-condensed font-bold text-sanatorio-blue">Acceso Administrador</h2>
          <p className="text-slate-500">Ingresa tus credenciales para gestionar el torneo</p>
        </div>

        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email Institucional</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-sanatorio-blue focus:ring-1 focus:ring-sanatorio-blue transition-all"
              placeholder="admin@sanatorio.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Contraseña</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-sanatorio-blue focus:ring-1 focus:ring-sanatorio-blue transition-all"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-sanatorio-blue text-white font-bold py-3 rounded-xl hover:bg-blue-900 transition-colors mt-6"
          >
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    );
  }

  if (session.user.email !== 'lmarinero@sanatorioargentino.com.ar') {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl text-center mt-20 border border-slate-100">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Acceso Denegado</h2>
        <p className="text-slate-500 mb-6">Esta sección es exclusiva para la administración del torneo (lmarinero@sanatorioargentino.com.ar).</p>
        <button onClick={handleLogout} className="bg-sanatorio-blue text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-900 transition-colors w-full">
          Cerrar Sesión y Volver
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-condensed font-bold text-sanatorio-blue">Panel de Administración</h2>
          <p className="text-sm text-slate-500">Sesión iniciada como: {session.user.email}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-red-500 font-semibold hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" /> Cerrar Sesión
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-start">
          <div className="p-3 bg-sanatorio-blue/10 rounded-xl mb-4">
            <Users className="w-6 h-6 text-sanatorio-blue" />
          </div>
          <h3 className="font-bold text-lg text-slate-800 mb-2">Gestión de Equipos</h3>
          <p className="text-slate-500 text-sm mb-6 flex-1">Aprobar Listas de Buena Fé, ver plantillas y detalles de los jugadores.</p>
          <Link to="/admin/equipos" className="w-full text-center py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-sanatorio-blue hover:text-white transition-colors">
            Administrar Equipos
          </Link>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-start">
          <div className="p-3 bg-sanatorio-pink/10 rounded-xl mb-4">
            <Activity className="w-6 h-6 text-sanatorio-pink" />
          </div>
          <h3 className="font-bold text-lg text-slate-800 mb-2">Carga de Partidos</h3>
          <p className="text-slate-500 text-sm mb-6 flex-1">Ingresar resultados, registrar goles, tarjetas y seleccionar al MVP.</p>
          <Link to="/admin/partidos" className="w-full text-center py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-sanatorio-pink hover:text-white transition-colors">
            Administrar Partidos
          </Link>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-start">
          <div className="p-3 bg-green-100 rounded-xl mb-4">
            <BarChart2 className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-bold text-lg text-slate-800 mb-2">Estadísticas</h3>
          <p className="text-slate-500 text-sm mb-6 flex-1">Las estadísticas se calculan automáticamente en base a los partidos jugados.</p>
          <button disabled className="w-full py-2 bg-slate-50 text-slate-400 font-semibold rounded-lg cursor-not-allowed">
            Automático
          </button>
        </div>
      </div>
    </div>
  );
};
