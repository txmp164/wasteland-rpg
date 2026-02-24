interface PixelCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const PixelCard = ({ children, className = '', onClick, disabled }: PixelCardProps) => {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`
        relative border-2 border-slate-600 bg-slate-800 p-3
        shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]
        active:shadow-none active:translate-y-[2px] active:translate-x-[2px]
        transition-all cursor-pointer select-none text-slate-200
        ${
          disabled
            ? 'opacity-50 cursor-not-allowed grayscale'
            : 'hover:bg-slate-700 hover:border-slate-400'
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
};
