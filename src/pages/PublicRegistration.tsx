import { useState } from 'react';
import { Calendar, CheckSquare, Trophy, AlertCircle, User, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const PublicRegistration = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [managementToken, setManagementToken] = useState('');
  const [error, setError] = useState('');
  
  const [teamData, setTeamData] = useState({
    teamName: '',
    date: '',
    players: Array(10).fill({ name: '', dni: '' }),
    womenCount: '',
    menCount: '',
    responsibleName: ''
  });

  const handlePlayerChange = (index: number, field: string, value: string) => {
    const newPlayers = [...teamData.players];
    newPlayers[index] = { ...newPlayers[index], [field]: value };
    setTeamData({ ...teamData, players: newPlayers });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Filter out empty players
    const validPlayers = teamData.players.filter(p => p.name.trim() !== '');
    
    if (validPlayers.length === 0) {
      setError('Debes ingresar al menos un jugador.');
      setLoading(false);
      return;
    }

    try {
      // 1. Insert Team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert([{
          name: teamData.teamName,
          captain_name: teamData.responsibleName,
          women_count: parseInt(teamData.womenCount) || 0,
          men_count: parseInt(teamData.menCount) || 0,
          status: 'pending',
          responsible_signature: teamData.responsibleName,
        }])
        .select()
        .single();

      if (teamError) throw teamError;

      // 2. Insert Players
      const playersToInsert = validPlayers.map(p => ({
        team_id: team.id,
        full_name: p.name,
        dni: p.dni,
      }));

      const { error: playersError } = await supabase
        .from('players')
        .insert(playersToInsert);

      if (playersError) throw playersError;

      setManagementToken(team.management_token);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al registrar el equipo.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const managementUrl = `${window.location.origin}/equipo/${managementToken}`;
    
    return (
      <div className="max-w-2xl mx-auto bg-white shadow-2xl rounded-3xl p-12 text-center mt-12 border border-slate-100">
        <Trophy className="w-24 h-24 text-sanatorio-blue mx-auto mb-6" />
        <h2 className="text-4xl font-condensed font-bold text-sanatorio-blue mb-4">¡INSCRIPCIÓN EXITOSA!</h2>
        <p className="text-slate-600 text-lg mb-6">
          La Lista de Buena Fé de <strong>{teamData.teamName}</strong> ha sido enviada correctamente. 
          Un administrador revisará la solicitud para activarla en el torneo.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8 text-left">
          <h3 className="font-bold text-sanatorio-blue text-lg mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Enlace Privado del Capitán
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Guarda este enlace secreto. Te servirá para administrar tu equipo, subir las fotos de los jugadores y armar tu formación en la pizarra táctica:
          </p>
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <input 
              type="text" 
              readOnly 
              value={managementUrl}
              className="flex-1 bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-700 outline-none font-medium"
            />
            <button 
              onClick={() => {
                navigator.clipboard.writeText(managementUrl);
                alert('¡Enlace copiado al portapapeles!');
              }}
              className="bg-sanatorio-blue text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1a4f8f] transition-colors whitespace-nowrap"
            >
              Copiar Link
            </button>
          </div>
        </div>

        <button 
          onClick={() => window.location.href = '/'}
          className="bg-sanatorio-pink text-white font-bold py-3 px-8 rounded-full shadow-md hover:bg-pink-600 transition-colors"
        >
          Volver al Portal
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-100 mt-8 mb-16 relative">
      {/* Decorative top dots */}
      <div className="absolute top-8 left-8 grid grid-cols-3 gap-1">
        {[...Array(9)].map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-sanatorio-blue rounded-full opacity-50"></div>)}
      </div>

      <form onSubmit={handleSubmit} className="p-8 md:p-12 relative z-10">
        
        {/* HEADER SECTION */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-0.5 w-16 bg-sanatorio-blue"></div>
            <h2 className="text-sanatorio-blue font-sans font-bold text-xl tracking-widest">
              MUNDIALITO MIXTO 2026
            </h2>
            <div className="h-0.5 w-16 bg-sanatorio-blue"></div>
          </div>
          
          <h1 className="font-condensed text-6xl md:text-8xl font-bold text-sanatorio-blue tracking-tighter leading-none mb-4">
            LISTA DE <span className="text-sanatorio-pink">BUENA FÉ</span>
          </h1>
          
          <div className="inline-block bg-sanatorio-blue text-white font-condensed italic font-bold text-xl md:text-2xl px-8 py-2 transform -skew-x-12 relative shadow-md">
            <span className="block transform skew-x-12">POR LA RECEPCIÓN DE INTERNADO</span>
            {/* Brush stroke effect using absolute divs */}
            <div className="absolute -bottom-2 -left-4 -right-4 h-3 bg-sanatorio-blue rounded-full opacity-80 blur-[2px]"></div>
          </div>
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-semibold text-sm">{error}</p>
          </div>
        )}

        {/* TEAM NAME & DATE SECTION */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-10">
          <div className="flex items-center gap-3 text-sanatorio-blue font-bold text-xl w-full md:w-auto">
            <Trophy className="w-8 h-8" />
            <span>EQUIPO:</span>
            <input 
              type="text" 
              required
              placeholder="Nombre del equipo"
              value={teamData.teamName}
              onChange={e => setTeamData({...teamData, teamName: e.target.value})}
              className="flex-1 md:w-64 border-b-2 border-sanatorio-blue text-slate-700 bg-transparent px-2 py-1 focus:outline-none focus:border-sanatorio-pink uppercase"
            />
          </div>

          <div className="flex items-center gap-3 text-sanatorio-blue font-bold text-xl w-full md:w-auto">
            <Calendar className="w-8 h-8" />
            <span>FECHA:</span>
            <input 
              type="date" 
              required
              value={teamData.date}
              onChange={e => setTeamData({...teamData, date: e.target.value})}
              className="flex-1 md:w-auto border-b-2 border-sanatorio-blue text-slate-700 bg-transparent px-2 py-1 focus:outline-none focus:border-sanatorio-pink"
            />
          </div>
        </div>

        {/* PLAYERS TABLE */}
        <div className="border-4 border-sanatorio-blue rounded-xl overflow-hidden mb-12 shadow-sm bg-white">
          <div className="grid grid-cols-[3rem_1fr_1fr_6rem] bg-sanatorio-blue text-white font-bold text-center text-sm md:text-base py-3">
            <div>Nº</div>
            <div className="border-l border-white/30">NOMBRE Y APELLIDO</div>
            <div className="border-l border-white/30">DNI</div>
            <div className="border-l border-white/30 hidden sm:block">FIRMA</div>
          </div>
          
          <div className="flex flex-col">
            {teamData.players.map((player, index) => (
              <div key={index} className="grid grid-cols-[3rem_1fr_1fr_6rem] border-b border-slate-300 last:border-b-0 items-stretch">
                <div className={`flex items-center justify-center font-bold text-white text-lg ${index % 2 === 0 ? 'bg-sanatorio-pink' : 'bg-sanatorio-blue'}`}>
                  {index + 1}
                </div>
                <div className="border-l border-slate-300 p-0">
                  <input 
                    type="text" 
                    value={player.name}
                    onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                    className="w-full h-full px-3 py-3 focus:outline-none focus:bg-slate-50 uppercase text-slate-700 font-medium"
                    placeholder=" "
                  />
                </div>
                <div className="border-l border-slate-300 p-0">
                  <input 
                    type="text" 
                    value={player.dni}
                    onChange={(e) => handlePlayerChange(index, 'dni', e.target.value)}
                    className="w-full h-full px-3 py-3 focus:outline-none focus:bg-slate-50 text-slate-700 font-medium text-center"
                    placeholder=" "
                  />
                </div>
                <div className="border-l border-slate-300 hidden sm:flex items-center justify-center bg-slate-50/50">
                  {/* Web doesn't need physical signature, but we keep the visual space */}
                  <div className="w-full h-full text-slate-300 border-dashed border-2 border-slate-200 m-1 rounded-md"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TEAM COMPOSITION */}
        <div className="mb-12 text-center relative">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-[2px] w-12 bg-slate-400"></div>
            <h3 className="text-sanatorio-blue font-bold text-xl tracking-widest">
              COMPOSICIÓN DEL EQUIPO
            </h3>
            <div className="h-[2px] w-12 bg-slate-400"></div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-8 md:gap-16">
            {/* Mujeres */}
            <div className="border-2 border-sanatorio-pink rounded-xl p-4 flex items-center gap-6 shadow-sm bg-white relative w-64 justify-center">
              <User className="text-sanatorio-pink w-12 h-12" fill="currentColor" />
              <div className="flex flex-col">
                <span className="text-sanatorio-pink font-bold text-lg tracking-wider">MUJERES</span>
                <input 
                  type="number"
                  required
                  value={teamData.womenCount}
                  onChange={e => setTeamData({...teamData, womenCount: e.target.value})}
                  className="border-b-2 border-sanatorio-pink text-4xl text-center text-slate-700 font-condensed w-24 focus:outline-none focus:border-sanatorio-blue" 
                />
              </div>
            </div>

            {/* Balon central */}
            <div className="hidden sm:block absolute left-1/2 top-1/2 transform -translate-x-1/2 translate-y-2 z-10 w-24 h-24">
               {/* Simulating the painted soccer ball */}
               <div className="w-full h-full rounded-full bg-white shadow-xl border-4 border-slate-800 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-sanatorio-pink/30 to-sanatorio-blue/30 mix-blend-multiply"></div>
                  <div className="w-12 h-12 border-4 border-slate-800 rounded-lg transform rotate-45"></div>
               </div>
            </div>

            {/* Varones */}
            <div className="border-2 border-sanatorio-blue rounded-xl p-4 flex items-center gap-6 shadow-sm bg-white relative w-64 justify-center">
              <User className="text-sanatorio-blue w-12 h-12" fill="currentColor" />
              <div className="flex flex-col">
                <span className="text-sanatorio-blue font-bold text-lg tracking-wider">VARONES</span>
                <input 
                  type="number"
                  required
                  value={teamData.menCount}
                  onChange={e => setTeamData({...teamData, menCount: e.target.value})}
                  className="border-b-2 border-sanatorio-blue text-4xl text-center text-slate-700 font-condensed w-24 focus:outline-none focus:border-sanatorio-pink" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* RESPONSIBLE SIGNATURE */}
        <div className="border-2 border-dashed border-sanatorio-pink/50 rounded-2xl p-6 md:p-8 bg-pink-50/30 flex flex-col sm:flex-row items-center gap-6 justify-center">
          <CheckSquare className="text-sanatorio-blue w-12 h-12" />
          <div className="flex items-center gap-4 w-full max-w-md">
            <span className="text-sanatorio-blue font-bold text-sm md:text-base whitespace-nowrap">FIRMA DEL RESPONSABLE:</span>
            <input 
              type="text" 
              required
              value={teamData.responsibleName}
              onChange={e => setTeamData({...teamData, responsibleName: e.target.value})}
              className="flex-1 border-b-2 border-slate-400 bg-transparent px-2 py-2 focus:outline-none focus:border-sanatorio-blue text-slate-700 font-medium"
              placeholder="Nombre completo"
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center mt-12 mb-6">
          <p className="font-condensed italic font-bold text-4xl text-sanatorio-blue opacity-80">
            ¡Te esperamos!
          </p>
        </div>

        <div className="flex justify-center mt-8">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-sanatorio-blue hover:bg-blue-900 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-4 px-12 rounded-full text-xl shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            {loading ? 'Enviando Registro...' : 'Enviar Lista de Buena Fé'}
          </button>
        </div>
      </form>
    </div>
  );
};
