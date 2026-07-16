import React, { useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

interface GuidedTourProps {
  run: boolean;
  onComplete: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ run, onComplete }) => {
  const [steps] = useState<Step[]>([
    {
      target: 'body',
      content: (
        <div>
          <h2 className="font-bold text-xl text-sanatorio-blue mb-2">¡Bienvenido al Portal!</h2>
          <p className="text-slate-600">Te daremos un breve recorrido para que aprendas a encontrar toda la información del Mundialito Mixto 2026.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.tour-header',
      content: (
        <div>
          <h3 className="font-bold text-sanatorio-blue">Panel Principal</h3>
          <p className="text-sm mt-1">Aquí verás los accesos rápidos. Si eres administrador, usa el candado para entrar al gestor.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.tour-rules',
      content: (
        <div>
          <h3 className="font-bold text-sanatorio-blue">Reglamento</h3>
          <p className="text-sm mt-1">Es muy importante leer las reglas del torneo antes de participar. Acá podés acceder al documento completo.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.tour-standings',
      content: (
        <div>
          <h3 className="font-bold text-sanatorio-pink">Tabla de Posiciones</h3>
          <p className="text-sm mt-1">Acá se irá actualizando en tiempo real cómo va la clasificación general de los equipos.</p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.tour-results',
      content: (
        <div>
          <h3 className="font-bold text-[#f89b29]">Resultados y Próximos</h3>
          <p className="text-sm mt-1">Revisá cómo salieron los últimos encuentros y fijate cuándo y contra quién te toca jugar la próxima fecha.</p>
        </div>
      ),
      placement: 'left',
    },
    {
      target: '.tour-stats',
      content: (
        <div>
          <h3 className="font-bold text-sanatorio-blue">Estadísticas</h3>
          <p className="text-sm mt-1">¿Quién es el goleador? ¿Quién dio más asistencias? Mantenete al tanto de los mejores jugadores del torneo acá.</p>
        </div>
      ),
      placement: 'top',
    }
  ]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      onComplete();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#0c2340', // sanatorio-blue
          textColor: '#334155',
          zIndex: 1000,
        },
        tooltip: {
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        },
        buttonNext: {
          backgroundColor: '#e6007e', // sanatorio-pink
          borderRadius: '8px',
          padding: '8px 16px',
        },
        buttonBack: {
          marginRight: 10,
        },
        buttonSkip: {
          color: '#64748b',
        }
      }}
      locale={{
        back: 'Atrás',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        skip: 'Saltar Tour',
      }}
    />
  );
};
