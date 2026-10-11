import React from 'react';

interface VeyraLabsLogoProps {
  size?: number;
  showText?: boolean;
  useImage?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const VeyraLabsLogo: React.FC<VeyraLabsLogoProps> = ({
  size = 32,
  showText = true,
  useImage = true,
  className = '',
  style = {}
}) => {
  return (
    <div 
      className={`veyralabs-logo-container ${className}`}
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: size > 28 ? '10px' : '8px',
        textDecoration: 'none',
        userSelect: 'none',
        ...style 
      }}
    >
      {useImage ? (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '8px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(172, 145, 241, 0.45)',
            border: '1px solid rgba(172, 145, 241, 0.3)',
            backgroundColor: '#020731',
            flexShrink: 0
          }}
        >
          <img
            src="/veyralabs-logo.jpg"
            alt="veyralabs"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scale(1.2)' // center and crop to the glowing diamond crystal
            }}
          />
        </div>
      ) : (
        /* Fallback Geometric Diamond Octahedron Prism SVG */
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0, filter: 'drop-shadow(0 0 10px rgba(101, 60, 161, 0.6))' }}
        >
          <defs>
            <linearGradient id="vy_left_prism" x1="20" y1="20" x2="50" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E879F9" />
              <stop offset="50%" stopColor="#C026D3" />
              <stop offset="100%" stopColor="#653CA1" />
            </linearGradient>
            <linearGradient id="vy_right_prism" x1="80" y1="20" x2="50" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#041258" />
            </linearGradient>
          </defs>
          <polygon points="50,12 88,50 50,88 12,50" stroke="#AC91F1" strokeWidth="1.5" fill="#020731" />
          <polygon points="50,22 18,50 50,78 50,50" fill="url(#vy_left_prism)" fillOpacity="0.85" />
          <polygon points="50,22 82,50 50,78 50,50" fill="url(#vy_right_prism)" fillOpacity="0.85" />
          <line x1="50" y1="12" x2="50" y2="88" stroke="#FFFFFF" strokeWidth="1.2" />
          <line x1="12" y1="50" x2="88" y2="50" stroke="#AC91F1" strokeWidth="0.8" />
          <circle cx="50" cy="50" r="3.5" fill="#FFFFFF" />
        </svg>
      )}

      {/* Brand Typographic Wordmark: exact lowercase 'veyralabs' */}
      {showText && (
        <span
          style={{
            fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            fontSize: size > 28 ? '19px' : '16px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: 'var(--text-primary)',
            textTransform: 'lowercase',
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center'
          }}
        >
          veyralabs
        </span>
      )}
    </div>
  );
};
