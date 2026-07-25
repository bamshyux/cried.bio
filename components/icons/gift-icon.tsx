type GiftIconProps = {
  size?: number;
  className?: string;
};

export function GiftIcon({ size = 18, className = "" }: GiftIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="gift-box-body" x1="4" y1="10" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="gift-box-lid" x1="4" y1="5" x2="20" y2="11" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fde68a" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="gift-ribbon-v" x1="12" y1="5" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f472b6" />
          <stop offset="1" stopColor="#c084fc" />
        </linearGradient>
        <linearGradient id="gift-ribbon-h" x1="4" y1="13" x2="20" y2="13" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fb7185" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id="gift-bow" x1="8" y1="2" x2="16" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fda4af" />
          <stop offset="0.5" stopColor="#f0abfc" />
          <stop offset="1" stopColor="#c4b5fd" />
        </linearGradient>
      </defs>

      <rect x="4" y="11" width="16" height="10" rx="1.5" fill="url(#gift-box-body)" />
      <path d="M4 10.5h16v1.5H4z" fill="url(#gift-box-lid)" />
      <path d="M4 8.5c0-1.5 3.6-3 8-3s8 1.5 8 3v2H4z" fill="url(#gift-box-lid)" />
      <rect x="10.25" y="8.5" width="3.5" height="12.5" rx="0.5" fill="url(#gift-ribbon-v)" />
      <rect x="4" y="14.25" width="16" height="3.5" rx="0.5" fill="url(#gift-ribbon-h)" />
      <path
        d="M12 5.5c-1.8-2.2-5-1.6-5 1.1 0 1.4 1.2 2.2 2.5 2.2H12zm0 0c1.8-2.2 5-1.6 5 1.1 0 1.4-1.2 2.2-2.5 2.2H12z"
        fill="url(#gift-bow)"
      />
      <circle cx="12" cy="5.6" r="1.1" fill="#fff" fillOpacity="0.85" />
    </svg>
  );
}

export function GiftButtonIcon({ className = "" }: { className?: string }) {
  return (
    <span className={`bf-gift-btn-icon inline-flex items-center justify-center ${className}`}>
      <GiftIcon size={17} />
    </span>
  );
}
