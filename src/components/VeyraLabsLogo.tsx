import React from 'react';

interface VeyraLabsLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const VeyraLabsLogo: React.FC<VeyraLabsLogoProps> = ({
  size = 32,
  showText = true,
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
      {/* Geometric Diamond Octahedron Prism SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.45))' }}
      >
        <defs>
          {/* Left Facet Gradient: Magenta / Violet */}
          <linearGradient id="vy_left_prism" x1="20" y1="20" x2="50" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E879F9" />
            <stop offset="50%" stopColor="#C026D3" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>

          {/* Right Facet Gradient: Electric Cyan / Sky */}
          <linearGradient id="vy_right_prism" x1="80" y1="20" x2="50" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>

          {/* Bottom Center Facet */}
          <linearGradient id="vy_bottom_prism" x1="50" y1="50" x2="50" y2="88" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#4338CA" />
          </linearGradient>

          {/* Outer Diamond Wireframe Glow */}
          <linearGradient id="vy_glow_line" x1="50" y1="12" x2="50" y2="88" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>
        </defs>

        {/* Outer Diamond Frame */}
        <polygon 
          points="50,12 88,50 50,88 12,50" 
          stroke="url(#vy_glow_line)" 
          strokeWidth="1.5" 
          strokeOpacity="0.7" 
          fill="rgba(11, 16, 32, 0.6)" 
        />

        {/* Left Inner Facet (Violet / Pink) */}
        <polygon 
          points="50,22 18,50 50,78 50,50" 
          fill="url(#vy_left_prism)" 
          fillOpacity="0.85" 
        />

        {/* Right Inner Facet (Cyan / Blue) */}
        <polygon 
          points="50,22 82,50 50,78 50,50" 
          fill="url(#vy_right_prism)" 
          fillOpacity="0.85" 
        />

        {/* Central Core Inset Pyramids */}
        <polygon 
          points="50,22 36,44 50,50" 
          fill="#F472B6" 
          fillOpacity="0.7" 
        />
        <polygon 
          points="50,22 64,44 50,50" 
          fill="#38BDF8" 
          fillOpacity="0.8" 
        />
        <polygon 
          points="50,50 36,56 50,78" 
          fill="#9333EA" 
          fillOpacity="0.75" 
        />
        <polygon 
          points="50,50 64,56 50,78" 
          fill="#0284C7" 
          fillOpacity="0.75" 
        />

        {/* Geometric Web Lines */}
        <line x1="50" y1="12" x2="50" y2="88" stroke="#E2E8F0" strokeWidth="1.2" strokeOpacity="0.9" />
        <line x1="12" y1="50" x2="88" y2="50" stroke="#E2E8F0" strokeWidth="0.8" strokeOpacity="0.6" />
        <line x1="50" y1="22" x2="18" y2="50" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.9" />
        <line x1="50" y1="22" x2="82" y2="50" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.9" />
        <line x1="50" y1="78" x2="18" y2="50" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.9" />
        <line x1="50" y1="78" x2="82" y2="50" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.9" />

        {/* Outer Apex Nodes */}
        <circle cx="50" cy="12" r="3" fill="#FFFFFF" filter="drop-shadow(0 0 4px #A78BFA)" />
        <circle cx="88" cy="50" r="3" fill="#38BDF8" filter="drop-shadow(0 0 4px #38BDF8)" />
        <circle cx="50" cy="88" r="3" fill="#FFFFFF" filter="drop-shadow(0 0 4px #C084FC)" />
        <circle cx="12" cy="50" r="3" fill="#F472B6" filter="drop-shadow(0 0 4px #F472B6)" />

        {/* Center Node */}
        <circle cx="50" cy="50" r="3.5" fill="#FFFFFF" filter="drop-shadow(0 0 6px #FFFFFF)" />
        <circle cx="50" cy="36" r="2" fill="#E2E8F0" />
        <circle cx="50" cy="64" r="2" fill="#E2E8F0" />
        <circle cx="36" cy="50" r="2" fill="#E2E8F0" />
        <circle cx="64" cy="50" r="2" fill="#E2E8F0" />
      </svg>

      {/* Brand Typographic Wordmark: exact lowercase 'veyralabs' */}
      {showText && (
        <span
          style={{
            fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            fontSize: size > 28 ? '19px' : '16px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: '#FFFFFF',
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
