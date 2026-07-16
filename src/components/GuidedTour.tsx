import React, { useState } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import type { Step } from 'react-joyride';

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
          <h2 style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#0c2340', marginBottom: 8 }}>
            ¡Bienvenido al Portal!
          </h2>
          <p style={{ color: '#475569' }}>
            Te daremos un breve recorrido para que aprendas a encontrar toda la información del Mundialito Mixto 2026.
          </p>
        </div>
      ),
      placement: 'center',
    },
    {
      target: '.tour-header',
      content: (
        <div>
          <h3 style={{ fontWeight: 'bold', color: '#0c2340' }}>Panel Principal</h3>
          <p style={{ fontSize: '0.875rem', marginTop: 4 }}>
            Aquí verás los accesos rápidos al reglamento y las estadísticas del torneo.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.tour-rules',
      content: (
        <div>
          <h3 style={{ fontWeight: 'bold', color: '#0c2340' }}>Reglamento</h3>
          <p style={{ fontSize: '0.875rem', marginTop: 4 }}>
            Es muy importante leer las reglas antes de participar. Accedé al documento completo desde aquí.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.tour-standings',
      content: (
        <div>
          <h3 style={{ fontWeight: 'bold', color: '#e6007e' }}>Tabla de Posiciones</h3>
          <p style={{ fontSize: '0.875rem', marginTop: 4 }}>
            Se actualiza en tiempo real con la clasificación general de todos los equipos.
          </p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.tour-results',
      content: (
        <div>
          <h3 style={{ fontWeight: 'bold', color: '#f89b29' }}>Resultados y Próximos</h3>
          <p style={{ fontSize: '0.875rem', marginTop: 4 }}>
            Revisá los últimos resultados y cuándo te toca jugar la próxima fecha.
          </p>
        </div>
      ),
      placement: 'left',
    },
    {
      target: '.tour-stats',
      content: (
        <div>
          <h3 style={{ fontWeight: 'bold', color: '#0c2340' }}>Estadísticas</h3>
          <p style={{ fontSize: '0.875rem', marginTop: 4 }}>
            Seguí de cerca al goleador, al mejor asistidor y al MVP del torneo.
          </p>
        </div>
      ),
      placement: 'top',
    },
  ]);

  const handleCallback = (data: any) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      onComplete();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      onEvent={handleCallback}
      options={{
        primaryColor: '#e6007e',
        overlayColor: 'rgba(0,0,0,0.6)',
        backgroundColor: '#ffffff',
        textColor: '#334155',
        buttons: ['back', 'close', 'primary', 'skip'],
        showProgress: true,
      }}
      locale={{
        back: 'Atrás',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        skip: 'Saltar Tour',
        open: 'Abrir Tour',
      }}
    />
  );
};
