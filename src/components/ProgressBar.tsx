interface ProgressBarProps {
  current: number;
  max: number;
  color?: string;
  label?: string;
  icon?: React.ReactNode;
}

export const ProgressBar = ({
  current,
  max,
  color = 'bg-green-600',
  icon,
}: ProgressBarProps) => {
  return (
    <div className="flex items-center gap-1 text-sm leading-none mb-1 pixel-font w-full">
      {icon && <span className="w-4 text-slate-400">{icon}</span>}
      <div className="flex-1 h-2 bg-slate-900 border border-slate-600 relative">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{
            width: `${Math.max(0, Math.min(100, (current / max) * 100))}%`,
          }}
        />
      </div>
    </div>
  );
};
