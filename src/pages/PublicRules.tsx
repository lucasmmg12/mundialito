import { ArrowLeft, BookOpen, Clock, Users, ShieldAlert, Trophy, MapPin, Calendar, Heart, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PublicRules = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 pt-8 px-4">
      <Link to="/" className="inline-flex items-center gap-2 text-sanatorio-blue hover:text-sanatorio-pink font-bold transition-colors">
        <ArrowLeft className="w-5 h-5" /> Volver al Portal
      </Link>
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-sanatorio-blue via-[#1a4f8f] to-sanatorio-pink rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 z-0"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 z-0"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="font-condensed text-4xl md:text-5xl font-bold mb-2 tracking-tight drop-shadow-md">COMUNICACIÓN OFICIAL</h1>
            <p className="text-white/90 font-medium text-lg md:text-xl max-w-2xl drop-shadow-sm">
              Mundialito Mixto 2026 - Reglamento e Itinerario
            </p>
          </div>
          <div className="hidden md:flex items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
             <BookOpen className="w-12 h-12 text-white opacity-90 drop-shadow-lg" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
        {/* Intro */}
        <div className="p-8 border-b border-slate-100">
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2 bg-sanatorio-blue/10 text-sanatorio-blue px-4 py-2 rounded-lg font-bold text-sm">
              <MapPin className="w-4 h-4" /> Rufrano – San Juan
            </div>
            <div className="flex items-center gap-2 bg-sanatorio-pink/10 text-sanatorio-pink px-4 py-2 rounded-lg font-bold text-sm">
              <Calendar className="w-4 h-4" /> Sábado 25 de Julio
            </div>
            <div className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm">
              <Clock className="w-4 h-4" /> 09:00 a 14:00 hs
            </div>
          </div>
          <p className="text-lg text-slate-600 leading-relaxed font-medium">
            Con enorme alegría te invitamos nuevamente a compartir una jornada especial de integración y recreación. Será un día para jugar, alentar y disfrutar en equipo ⚽🃏🤖 ¡y también para vivir la fiesta desde la hinchada! 🎉
            <br/><br/>
            Para Colaboradores e integrantes del equipo femenino del sanatorio.
            ¡Llevar camisetas, banderas, lo que tengas relacionado con la selección Argentina!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-slate-50">
          {/* Rules */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-sanatorio-blue rounded-lg"><ShieldCheck className="text-white w-5 h-5" /></div>
              <h2 className="text-2xl font-condensed font-bold text-sanatorio-blue">Reglas Principales</h2>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <span className="w-2 h-2 mt-2 rounded-full bg-sanatorio-pink shrink-0"></span>
                <span className="text-slate-700"><strong>Cancha:</strong> Fútbol 5.</span>
              </li>
              <li className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <span className="w-2 h-2 mt-2 rounded-full bg-sanatorio-pink shrink-0"></span>
                <span className="text-slate-700"><strong>Duración:</strong> 2 tiempos de 7 min. Con entretiempo de 2 min.</span>
              </li>
              <li className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <span className="w-2 h-2 mt-2 rounded-full bg-sanatorio-pink shrink-0"></span>
                <span className="text-slate-700"><strong>En cancha:</strong> Máximo 2 varones, el resto mujeres.</span>
              </li>
              <li className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <span className="w-2 h-2 mt-2 rounded-full bg-sanatorio-pink shrink-0"></span>
                <span className="text-slate-700"><strong>Goles y Arqueras:</strong> Solo mujeres hacen goles y atajan (flexible en la final).</span>
              </li>
              <li className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <span className="w-2 h-2 mt-2 rounded-full bg-sanatorio-pink shrink-0"></span>
                <div className="text-slate-700">
                  <strong>Formato:</strong>
                  <ul className="list-disc ml-5 mt-2 text-sm text-slate-600 space-y-1">
                    <li>12 equipos → 2 zonas de 6, final entre ganadores.</li>
                    <li>10 equipos → 2 zonas de 5, semifinales y final.</li>
                  </ul>
                </div>
              </li>
            </ul>
          </div>

          <div className="space-y-8">
            {/* Kids */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-sanatorio-pink rounded-lg"><Heart className="text-white w-5 h-5" /></div>
                <h2 className="text-2xl font-condensed font-bold text-sanatorio-blue">Fútbol Infantil</h2>
              </div>
              <div className="bg-sanatorio-pink/5 border border-sanatorio-pink/20 p-5 rounded-xl">
                <p className="text-slate-700 font-medium">Para hijos, sobrinos, nietos del personal del sanatorio.</p>
                <p className="text-sm text-slate-500 mt-2">Se realizará una inscripción a través de Google Forms.</p>
              </div>
            </div>

            {/* Fans */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-400 rounded-lg"><Users className="text-white w-5 h-5" /></div>
                <h2 className="text-2xl font-condensed font-bold text-sanatorio-blue">Hinchada y Acompañantes</h2>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-3">
                <p className="font-bold text-slate-800">¡Los hinchas también son protagonistas! 💪🎉</p>
                <ul className="text-slate-600 text-sm space-y-2 list-disc ml-4">
                  <li>Pueden sumarse en cualquier momento con mate y cosas ricas 🧉🥟.</li>
                  <li>El objetivo es alentar, compartir y disfrutar de una mañana distinta, llena de integración y buena energía.</li>
                </ul>
              </div>
            </div>
            
            {/* Objectives */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500 rounded-lg"><Trophy className="text-white w-5 h-5" /></div>
                <h2 className="text-2xl font-condensed font-bold text-sanatorio-blue">Objetivos</h2>
              </div>
              <ul className="grid grid-cols-2 gap-3">
                <li className="bg-white p-3 rounded-lg border border-slate-100 text-sm font-medium text-slate-700 shadow-sm">✔️ Integración y compañerismo.</li>
                <li className="bg-white p-3 rounded-lg border border-slate-100 text-sm font-medium text-slate-700 shadow-sm">✔️ Bienestar físico, psicológico y social.</li>
                <li className="bg-white p-3 rounded-lg border border-slate-100 text-sm font-medium text-slate-700 shadow-sm">✔️ Diversión compartida.</li>
                <li className="bg-white p-3 rounded-lg border border-slate-100 text-sm font-medium text-slate-700 shadow-sm">✔️ Bienvenida a Nuevos Servicios.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Guia Organizativa */}
        <div className="p-8 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-800 rounded-lg"><ShieldAlert className="text-white w-5 h-5" /></div>
            <h2 className="text-2xl font-condensed font-bold text-slate-800">Guía Organizativa (Itinerario y Logística)</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h3 className="font-bold text-sanatorio-blue mb-3 border-b border-slate-200 pb-2">🔑 Acreditación</h3>
              <ul className="text-sm text-slate-600 space-y-2 list-disc ml-4">
                <li>Máx. 12 jugadores (Recomendado 7 M / 5 V).</li>
                <li>Planilla impresa vía recepción de internado o foto por WhatsApp.</li>
                <li><strong>Límite:</strong> 09:10 hs. Sin excepciones para evitar retrasos.</li>
              </ul>
            </div>
            
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h3 className="font-bold text-sanatorio-blue mb-3 border-b border-slate-200 pb-2">🎤 Conducción</h3>
              <ul className="text-sm text-slate-600 space-y-2 list-disc ml-4">
                <li>Maestro/a de ceremonias.</li>
                <li>Música durante toda la jornada.</li>
                <li>Micrófono para animar y anunciar resultados.</li>
              </ul>
            </div>
            
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h3 className="font-bold text-sanatorio-blue mb-3 border-b border-slate-200 pb-2">⚽ Arbitraje</h3>
              <ul className="text-sm text-slate-600 space-y-2 list-disc ml-4">
                <li>Árbitros externos ya confirmados.</li>
                <li>Apoyo logístico de Argentino F.C.</li>
                <li>Planillas de control por partido.</li>
              </ul>
            </div>
            
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h3 className="font-bold text-sanatorio-blue mb-3 border-b border-slate-200 pb-2">🩺 Salud y Seguridad</h3>
              <ul className="text-sm text-slate-600 space-y-2 list-disc ml-4">
                <li>Enfermería / Primeros auxilios.</li>
                <li>Puestos de hidratación.</li>
                <li>Llevar ropa deportiva y calzado adecuado.</li>
              </ul>
            </div>
            
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h3 className="font-bold text-sanatorio-blue mb-3 border-b border-slate-200 pb-2">📸 Comunicación</h3>
              <ul className="text-sm text-slate-600 space-y-2 list-disc ml-4">
                <li>Equipo sacando fotos y videos.</li>
                <li>Banner institucional para foto grupal.</li>
                <li>Publicación en Humand y WhatsApp.</li>
              </ul>
            </div>
            
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h3 className="font-bold text-sanatorio-blue mb-3 border-b border-slate-200 pb-2">🏆 Premiación</h3>
              <ul className="text-sm text-slate-600 space-y-2 list-disc ml-4">
                <li>Copa Challenger.</li>
                <li>Medallas para infantiles.</li>
                <li>Premio a la Mejor Hinchada.</li>
                <li>Premio a la Goleadora.</li>
              </ul>
            </div>
            
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h3 className="font-bold text-sanatorio-blue mb-3 border-b border-slate-200 pb-2">🍴 Tercer Tiempo</h3>
              <ul className="text-sm text-slate-600 space-y-2 list-disc ml-4">
                <li>Hamburguesas + bebidas.</li>
                <li>Opciones Vegetariana y Sin TACC.</li>
                <li>Mesas y sillas para equipos.</li>
              </ul>
            </div>
            
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 lg:col-span-2">
              <h3 className="font-bold text-sanatorio-blue mb-3 border-b border-slate-200 pb-2">🌦 Plan B y Cierre</h3>
              <p className="text-sm text-slate-600 mb-2"><strong>Lluvia:</strong> Espacio techado alternativo. Se avisará con anticipación en caso de reprogramación.</p>
              <p className="text-sm text-slate-600"><strong>Cierre:</strong> Palabras finales de Dirección/RRHH y Foto grupal oficial.</p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
