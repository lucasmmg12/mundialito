
export const FootballBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      {/* The main background image */}
      <img 
        src="/WhatsApp_Image_2026-07-14_at_1.25.58_202607141410.jpeg" 
        alt="Fondo Mundialito" 
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* The darkening overlay - dark on the bottom/left, transparent at the top-right */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/90 via-slate-900/70 to-transparent"></div>
    </div>
  );
};
