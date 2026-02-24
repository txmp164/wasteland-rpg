interface IconProps {
  size?: number;
  className?: string;
}

const IconBase = ({
  d,
  color,
  size = 24,
  className = '',
}: {
  d: React.ReactNode;
  color?: string;
  size?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${color} ${className}`}
  >
    {d}
  </svg>
);

export const Sword = (props: IconProps) => (
  <IconBase {...props} d={<path d="M14.5 17.5L3 6V3h3l11.5 11.5m-5-5l5 5m-5-5l5 5" />} />
);

export const Shield = (props: IconProps) => (
  <IconBase
    {...props}
    d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />}
  />
);

export const Heart = (props: IconProps) => (
  <IconBase
    {...props}
    d={
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    }
  />
);

export const Activity = (props: IconProps) => (
  <IconBase {...props} d={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />} />
);

export const Skull = (props: IconProps) => (
  <IconBase
    {...props}
    d={
      <>
        <path d="M12 2c-4.42 0-8 3.58-8 8a8.01 8.01 0 0 0 2.5 5.8l1.5 2.2H16l1.5-2.2A8.01 8.01 0 0 0 20 10c0-4.42-3.58-8-8-8z" />
        <path d="M9 14h6" />
        <path d="M15 17h.01" />
        <path d="M9 17h.01" />
      </>
    }
  />
);

export const ShoppingBag = (props: IconProps) => (
  <IconBase
    {...props}
    d={
      <>
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </>
    }
  />
);

export const Briefcase = (props: IconProps) => (
  <IconBase
    {...props}
    d={
      <>
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </>
    }
  />
);

export const Footprints = (props: IconProps) => (
  <IconBase
    {...props}
    d={
      <>
        <path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 11 3.8 11 8c0 1.25-.76 2.5-2 3.5-1.24 1-2 2.25-2 3.5V17" />
        <path d="M14 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C8.63 6 7 7.8 7 12c0 1.25.76 2.5 2 3.5 1.24 1 2 2.25 2 3.5V21" />
      </>
    }
  />
);

export const LogOut = (props: IconProps) => (
  <IconBase
    {...props}
    d={
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </>
    }
  />
);

export const Radio = (props: IconProps) => (
  <IconBase
    {...props}
    d={
      <>
        <circle cx="12" cy="12" r="2" />
        <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
      </>
    }
  />
);

export const Coins = (props: IconProps) => (
  <IconBase
    {...props}
    d={
      <>
        <circle cx="8" cy="8" r="6" />
        <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
        <path d="M7 6h1v4" />
        <path d="M17.121 17.121A3 3 0 1 0 21.364 21.364 3 3 0 1 0 17.121 17.121z" />
      </>
    }
  />
);

export const Trash2 = (props: IconProps) => (
  <IconBase
    {...props}
    d={
      <>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </>
    }
  />
);

export const Utensils = (props: IconProps) => (
  <IconBase
    {...props}
    d={
      <>
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
        <path d="M7 2v20" />
        <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
      </>
    }
  />
);

export const Smile = (props: IconProps) => (
  <IconBase
    {...props}
    d={
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </>
    }
  />
);

export const Hammer = (props: IconProps) => (
  <IconBase
    {...props}
    d={
      <>
        <path d="M15 12l-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9" />
        <path d="M17.64 15L22 10.64" />
        <path d="M20.91 8.26L15.73 3.08a1 1 0 0 0-1.41 0l-1.42 1.42a1 1 0 0 0 0 1.41l5.66 5.66a1 1 0 0 0 1.41 0l1.42-1.42a1 1 0 0 0 0-1.41z" />
      </>
    }
  />
);

export const HelpCircle = (props: IconProps) => (
  <IconBase
    {...props}
    d={
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </>
    }
  />
);

export const Gem = (props: IconProps) => (
  <IconBase {...props} d={<path d="M6 3h12l4 6-10 13L2 9z" />} />
);

export const Rocket = (props: IconProps) => (
  <IconBase
    {...props}
    d={
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3m1.5 1.5l2-2M2 22l1.5-1.5M9 11l.5-.5M20 4l-4 4m1-4l3 3M15 12s-4-4-8-1l12 12c3-4-1-8-1-8z" />
    }
  />
);
