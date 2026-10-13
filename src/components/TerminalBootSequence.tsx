import React, { useEffect, useRef, useState } from 'react';
import {
  gsap,
  prefersReducedMotion,
  scrambleDecodeText,
  animateSvgStrokes,
} from '../utils/gsapMotion';

interface TerminalBootSequenceProps {
  totalModelsCount?: number;
  onComplete?: () => void;
}

const BOOT_DIAGNOSTICS = [
  { code: '0x00A1', subsystem: 'THREEUI_RETRO_DOCK', status: 'MOUNTED [8x8 BAYER DITHER // 8-STOP DUSK PALETTE]' },
  { code: '0x00B4', subsystem: 'PROVIDER_BRIDGES', status: 'LINKED [GOOGLE GEMINI DIRECT + GROQ LPU + OPENROUTER]' },
  { code: '0x00C9', subsystem: 'PARETO_SOLVER_V4', status: 'CALIBRATED [COST // P95 LATENCY // LMSYS ARENA ELO]' },
  { code: '0x00DF', subsystem: 'CATALOG_TELEMETRY', status: 'SYNCHRONIZED [656 AI MODELS // LIVE BENCHMARK MATRIX]' },
  { code: '0x00F0', subsystem: 'VEYRA_COMMAND_HUD', status: 'READY — ENGAGING PIXEL TERMINAL INTERFACE...' },
];

export const TerminalBootSequence: React.FC<TerminalBootSequenceProps> = ({
  totalModelsCount = 656,
  onComplete,
}) => {
  const [dismissed, setDismissed] = useState<boolean>(() => prefersReducedMotion());
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subTitleRef = useRef<HTMLDivElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);
  const barFillRef = useRef<HTMLDivElement>(null);
  const scanlineRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);

  const finishBoot = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setDismissed(true);
    onComplete?.();
  };

  useEffect(() => {
    if (prefersReducedMotion()) {
      finishBoot();
      return;
    }

    // Fail-safe timeout so the boot screen can never block the user even if tab is backgrounded
    const safetyTimer = window.setTimeout(() => {
      finishBoot();
    }, 2100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        finishBoot();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const ctx = gsap.context(() => {
      const overlay = overlayRef.current;
      if (!overlay) return;

      animateSvgStrokes(overlay, 0);

      if (titleRef.current) {
        scrambleDecodeText(
          titleRef.current,
          'VEYRA//OS PIXEL TERMINAL — AI COMMAND CENTER',
          { duration: 0.55, ease: 'power3.out' }
        );
      }
      if (subTitleRef.current) {
        scrambleDecodeText(
          subTitleRef.current,
          `KERNEL_BOOT // ROUTING_ENGINE_ONLINE // ${totalModelsCount}_MODELS_INDEXED`,
          { duration: 0.65, delay: 0.08 }
        );
      }

      const tl = gsap.timeline({
        onComplete: () => {
          finishBoot();
        },
      });

      // Laser scanline vertical sweep
      if (scanlineRef.current) {
        tl.fromTo(
          scanlineRef.current,
          { top: '0%', opacity: 0.95 },
          { top: '100%', opacity: 0.35, duration: 0.85, ease: 'power1.inOut' },
          0
        );
      }

      // Flickering system status indicators
      tl.fromTo(
        '.boot-flicker-pill',
        { opacity: 0, scale: 0.92, y: -6 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.22,
          stagger: 0.045,
          ease: 'steps(3)',
        },
        0.04
      );

      // Diagnostic telemetry lines rapid reveal
      tl.fromTo(
        '.boot-diag-line',
        { opacity: 0, x: -14, clipPath: 'inset(0 100% 0 0)' },
        {
          opacity: 1,
          x: 0,
          clipPath: 'inset(0 0% 0 0)',
          duration: 0.24,
          stagger: 0.09,
          ease: 'power2.out',
        },
        0.08
      );

      // Progress percentage & bar fill
      const progressState = { pct: 0 };
      tl.to(
        progressState,
        {
          pct: 100,
          duration: 0.78,
          ease: 'expo.inOut',
          onUpdate: () => {
            if (percentRef.current) {
              percentRef.current.textContent = `${String(Math.round(progressState.pct)).padStart(3, '0')}%`;
            }
          },
        },
        0.05
      );

      if (barFillRef.current) {
        tl.fromTo(
          barFillRef.current,
          { scaleX: 0, transformOrigin: 'left center' },
          { scaleX: 1, duration: 0.78, ease: 'expo.inOut' },
          0.05
        );
      }

      // Brief chromatic lock-in pulse + CRT aperture split reveal
      tl.to(
        '.boot-hud-frame',
        {
          scale: 1.02,
          boxShadow: '0 0 36px rgba(242, 201, 125, 0.45)',
          duration: 0.12,
          ease: 'power2.out',
        },
        0.84
      );

      tl.to(
        overlay,
        {
          clipPath: 'polygon(0% 50%, 100% 50%, 100% 50%, 0% 50%)',
          opacity: 0,
          duration: 0.32,
          ease: 'expo.inOut',
        },
        0.94
      );
    }, overlayRef);

    return () => {
      window.clearTimeout(safetyTimer);
      window.removeEventListener('keydown', handleKeyDown);
      ctx.revert();
    };
  }, []);

  if (dismissed) return null;

  return (
    <div
      ref={overlayRef}
      onClick={finishBoot}
      role="status"
      aria-live="polite"
      aria-label="Initializing VeyraLabs AI Command Center"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#120e1c',
        backgroundImage: `
          linear-gradient(rgba(112, 88, 168, 0.14) 1px, transparent 1px),
          linear-gradient(90deg, rgba(112, 88, 168, 0.14) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        cursor: 'pointer',
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
        userSelect: 'none',
      }}
    >
      {/* Moving horizontal laser scanline */}
      <div
        ref={scanlineRef}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '3px',
          background:
            'linear-gradient(90deg, transparent 0%, #7058a8 20%, #f2c97d 50%, #d96b6b 80%, transparent 100%)',
          boxShadow: '0 0 18px #f2c97d',
          pointerEvents: 'none',
        }}
      />

      {/* Central Pixel Terminal Diagnostic Frame */}
      <div
        className="boot-hud-frame"
        style={{
          width: '100%',
          maxWidth: '720px',
          backgroundColor: '#1a1528',
          border: '2px solid #f2c97d',
          boxShadow: '8px 8px 0 #09060e',
          padding: '24px 28px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top System Indicators Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            borderBottom: '2px solid #4a3a6e',
            paddingBottom: '12px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg
              className="gsap-svg-draw"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f2c97d"
              strokeWidth="2"
            >
              <rect x="2" y="2" width="20" height="20" data-gsap-stroke="true" />
              <polyline points="6 9 10 12 6 15" data-gsap-stroke="true" />
              <line x1="12" y1="15" x2="18" y2="15" data-gsap-stroke="true" />
            </svg>
            <span
              className="boot-flicker-pill"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                color: '#f2c97d',
                letterSpacing: '0.1em',
              }}
            >
              [SYS_BOOT // VEYRA_OS_4.2]
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="boot-flicker-pill"
              style={{
                padding: '2px 7px',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                backgroundColor: '#2a2040',
                border: '1px solid #7058a8',
                color: '#f5e6c8',
              }}
            >
              WEBGL_DITHER: 8x8_ORDERED
            </span>
            <span
              className="boot-flicker-pill"
              style={{
                padding: '2px 7px',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'rgba(242, 201, 125, 0.14)',
                border: '1px solid #f2c97d',
                color: '#f2c97d',
              }}
            >
              ROUTING_CORE: ACTIVE
            </span>
          </div>
        </div>

        {/* Main Scramble Title */}
        <div
          ref={titleRef}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(1rem, 2.2vw, 1.35rem)',
            fontWeight: 700,
            color: '#f5e6c8',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '6px',
            textShadow: '-2px 0 rgba(217, 107, 107, 0.5), 2px 0 rgba(112, 88, 168, 0.6)',
          }}
        >
          VEYRA//OS PIXEL TERMINAL — AI COMMAND CENTER
        </div>
        <div
          ref={subTitleRef}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#c4816c',
            letterSpacing: '0.08em',
            marginBottom: '18px',
          }}
        >
          {`KERNEL_BOOT // ROUTING_ENGINE_ONLINE // ${totalModelsCount}_MODELS_INDEXED`}
        </div>

        {/* Diagnostic Readout Log */}
        <div
          style={{
            backgroundColor: '#120e1c',
            border: '1px solid #4a3a6e',
            padding: '12px 14px',
            marginBottom: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {BOOT_DIAGNOSTICS.map((item) => (
            <div
              key={item.code}
              className="boot-diag-line"
              style={{
                display: 'flex',
                alignItems: ' baseline',
                justifyContent: 'space-between',
                gap: '12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                lineHeight: 1.4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ color: '#7058a8', fontWeight: 700 }}>[{item.code}]</span>
                <span style={{ color: '#f2c97d', fontWeight: 600 }}>{item.subsystem}</span>
              </div>
              <span
                style={{
                  color: '#f5e6c8',
                  opacity: 0.9,
                  textAlign: 'right',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>

        {/* Progress Bar & Telemetry Counter */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              marginBottom: '6px',
            }}
          >
            <span style={{ color: '#b8a8d4', letterSpacing: '0.08em' }}>
              NEURAL_ROUTER_CALIBRATION_PROGRESS
            </span>
            <span
              ref={percentRef}
              style={{
                color: '#f2c97d',
                fontWeight: 700,
                fontSize: '13px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              000%
            </span>
          </div>

          <div
            style={{
              width: '100%',
              height: '12px',
              backgroundColor: '#120e1c',
              border: '2px solid #7058a8',
              padding: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              ref={barFillRef}
              style={{
                width: '100%',
                height: '100%',
                background:
                  'repeating-linear-gradient(90deg, #f2c97d 0px, #f2c97d 8px, #2a2040 8px, #2a2040 10px)',
              }}
            />
          </div>
        </div>

        {/* Instant Skip Footer */}
        <div
          style={{
            marginTop: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: '#b8a8d4',
            opacity: 0.8,
          }}
        >
          <span>STATUS: INITIALIZING_VIEWPORT_TIMELINE</span>
          <span style={{ color: '#f2c97d', textDecoration: 'underline' }}>
            [CLICK OR PRESS ESC TO SKIP INTRO]
          </span>
        </div>
      </div>
    </div>
  );
};
