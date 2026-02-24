interface CRTOverlayProps {
  sanity: number;
}

export const CRTOverlay = ({ sanity }: CRTOverlayProps) => {
  const glitchIntensity = sanity < 30 ? 'opacity-30' : 'opacity-0';

  return (
    <div className="pointer-events-none absolute inset-0 z-[60] overflow-hidden rounded-lg">
      <div className="scanline"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.2)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
      <div
        className={`absolute inset-0 bg-noise mix-blend-overlay ${glitchIntensity} pointer-events-none transition-opacity duration-1000`}
      ></div>
      {sanity < 50 && (
        <div className="absolute top-2 left-2 text-[10px] text-red-500 animate-pulse font-bold tracking-widest">
          ⚠ MENTAL CRITICAL
        </div>
      )}
    </div>
  );
};
