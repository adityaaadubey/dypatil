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
            borderRadius: '0px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '3px 3px 0 var(--shadow-color)',
            border: '2px solid var(--border-accent-strong)',
            backgroundColor: 'var(--bg-primary)',
            flexShrink: 0
          }}
        >
          <img
            src="/veyralabs-logo.jpg"
            alt="VeyraLabs Pixel Terminal Emblem"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scale(1.18)'
            }}
          />
        </div>
      ) : (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
        >
          <rect x="6" y="6" width="88" height="88" stroke="#f4e6c8" strokeWidth="6" fill="#150c28" />
          <polygon points="50,16 84,50 50,84 16,50" stroke="#f9c74f" strokeWidth="4" fill="#241548" />
          <polygon points="50,26 26,50 50,74 50,50" fill="#9e4784" />
          <polygon points="50,26 74,50 50,74 50,50" fill="#f47b5c" />
          <rect x="44" y="44" width="12" height="12" fill="#f4e6c8" />
        </svg>
      )}

      {/* Pixel Terminal Brand Wordmark */}
      {showText && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: size > 28 ? '15px' : '13px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px'
          }}
        >
          <span>VEYRA</span>
          <span style={{ color: 'var(--accent-gold)' }}>//</span>
          <span>LABS</span>
        </span>
      )}
    </div>
  );
};
