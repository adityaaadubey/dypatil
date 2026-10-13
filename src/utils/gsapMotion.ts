import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(ScrollTrigger, Flip);

export { gsap, ScrollTrigger, Flip };

const CYBER_GLYPHS = '█▓▒░01/_<>[]#*$@%&+=~^?:';

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface ScrambleOptions {
  duration?: number;
  delay?: number;
  ease?: string;
  onComplete?: () => void;
}

/**
 * Cybernetic character-level scramble & decode reveal using GSAP tween.
 * Always guarantees the exact finalText is restored on completion or kill.
 */
export function scrambleDecodeText(
  el: HTMLElement | null,
  finalText: string,
  options: ScrambleOptions = {}
): gsap.core.Tween | null {
  if (!el) return null;
  if (prefersReducedMotion()) {
    el.textContent = finalText;
    options.onComplete?.();
    return null;
  }

  const duration = options.duration ?? 0.65;
  const delay = options.delay ?? 0;
  const ease = options.ease ?? 'power2.out';
  const length = finalText.length;
  const state = { progress: 0 };

  gsap.killTweensOf(el);

  return gsap.to(state, {
    progress: 1,
    duration,
    delay,
    ease,
    onUpdate: () => {
      const p = state.progress;
      const revealedCount = Math.floor(p * length);
      let output = '';
      for (let i = 0; i < length; i++) {
        const ch = finalText[i];
        if (ch === ' ' || ch === '\n') {
          output += ch;
        } else if (i < revealedCount) {
          output += ch;
        } else if (i < revealedCount + Math.ceil(length * 0.35)) {
          const glyphIdx = (i * 7 + Math.floor(p * 47)) % CYBER_GLYPHS.length;
          output += CYBER_GLYPHS[glyphIdx];
        } else {
          output += '░';
        }
      }
      el.textContent = output;
    },
    onComplete: () => {
      el.textContent = finalText;
      options.onComplete?.();
    },
    onInterrupt: () => {
      el.textContent = finalText;
    },
  });
}

export interface SplitHeadingOptions {
  duration?: number;
  stagger?: number;
  delay?: number;
  y?: number;
}

/**
 * Splits a heading into character or word spans, runs a staggered 3D kinetic reveal
 * with chromatic glitch flash, and restores clean text on completion.
 */
export function splitAndAnimateHeading(
  el: HTMLElement | null,
  options: SplitHeadingOptions = {}
): gsap.core.Timeline | null {
  if (!el) return null;
  const rawText = el.getAttribute('data-gsap-text') || el.textContent || '';
  if (!rawText.trim()) return null;

  el.setAttribute('data-gsap-text', rawText);
  el.setAttribute('aria-label', rawText);

  if (prefersReducedMotion()) {
    el.textContent = rawText;
    gsap.set(el, { opacity: 1, clearProps: 'all' });
    return null;
  }

  // Split into words and characters
  const words = rawText.split(' ');
  el.innerHTML = words
    .map(
      (word) =>
        `<span class="gsap-word" style="display:inline-block;white-space:nowrap;">${word
          .split('')
          .map(
            (ch) =>
              `<span class="gsap-char" style="display:inline-block;will-change:transform,opacity,filter;">${
                ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch === '&' ? '&amp;' : ch
              }</span>`
          )
          .join('')}</span>`
    )
    .join('<span style="display:inline-block;width:0.32em;"> </span>');

  const chars = el.querySelectorAll<HTMLElement>('.gsap-char');
  const tl = gsap.timeline({
    delay: options.delay ?? 0,
    onComplete: () => {
      el.textContent = rawText;
    },
  });

  tl.fromTo(
    chars,
    {
      opacity: 0,
      y: options.y ?? 14,
      rotateX: -75,
      scale: 0.86,
      filter: 'blur(4px)',
      textShadow: '-3px 0 #d96b6b, 3px 0 #7058a8',
    },
    {
      opacity: 1,
      y: 0,
      rotateX: 0,
      scale: 1,
      filter: 'blur(0px)',
      textShadow: '0px 0 transparent, 0px 0 transparent',
      duration: options.duration ?? 0.42,
      stagger: options.stagger ?? 0.014,
      ease: 'back.out(1.8)',
    }
  );

  return tl;
}

export interface CounterOptions {
  duration?: number;
  delay?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  formatter?: (val: number) => string;
  ease?: string;
}

/**
 * Sequential number counter tween for telemetry metrics, Elo scores, latency, and costs.
 * Stores the current value in data-counter-val so live updates smoothly transition from the old number!
 */
export function animateMetricCounter(
  el: HTMLElement | null,
  targetValue: number,
  options: CounterOptions = {}
): gsap.core.Tween | null {
  if (!el || !Number.isFinite(targetValue)) return null;

  const decimals = options.decimals ?? 0;
  const prefix = options.prefix ?? '';
  const suffix = options.suffix ?? '';

  const formatVal = (v: number): string => {
    if (options.formatter) return options.formatter(v);
    const fixed = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString();
    return `${prefix}${fixed}${suffix}`;
  };

  if (prefersReducedMotion()) {
    el.textContent = formatVal(targetValue);
    el.setAttribute('data-counter-val', String(targetValue));
    return null;
  }

  const prevAttr = el.getAttribute('data-counter-val');
  const startVal = prevAttr !== null && Number.isFinite(Number(prevAttr)) ? Number(prevAttr) : 0;
  const proxy = { val: startVal };

  return gsap.to(proxy, {
    val: targetValue,
    duration: options.duration ?? 0.85,
    delay: options.delay ?? 0,
    ease: options.ease ?? 'expo.out',
    onUpdate: () => {
      el.textContent = formatVal(proxy.val);
    },
    onComplete: () => {
      el.textContent = formatVal(targetValue);
      el.setAttribute('data-counter-val', String(targetValue));
    },
  });
}

/**
 * Fires a rapid cybernetic RGB glitch & chromatic burst on any element.
 */
export function triggerGlitchBurst(el: HTMLElement | null): gsap.core.Timeline | null {
  if (!el || prefersReducedMotion()) return null;

  const tl = gsap.timeline({
    onComplete: () => {
      gsap.set(el, { clearProps: 'transform,textShadow,filter' });
    },
  });

  tl.to(el, {
    x: -3,
    skewX: 6,
    textShadow: '-3px 0 #d96b6b, 3px 0 #7058a8',
    duration: 0.045,
    ease: 'steps(1)',
  })
    .to(el, {
      x: 4,
      skewX: -5,
      textShadow: '3px 0 #f2c97d, -3px 0 #8a4f7d',
      duration: 0.045,
      ease: 'steps(1)',
    })
    .to(el, {
      x: -1,
      skewX: 2,
      textShadow: '-1px 0 #d96b6b, 1px 0 #7058a8',
      duration: 0.04,
      ease: 'steps(1)',
    })
    .to(el, {
      x: 0,
      skewX: 0,
      textShadow: 'none',
      duration: 0.04,
    });

  return tl;
}

/**
 * Attaches magnetic micro-physics and press feedback to buttons, tabs, and sub-dock cells
 * inside a container. Excludes ThreeUI's internal .atd-retro__item to preserve native shader dock physics.
 */
export function attachMagneticInteraction(rootEl: HTMLElement | null): () => void {
  if (!rootEl || prefersReducedMotion()) return () => {};

  const targets = Array.from(
    rootEl.querySelectorAll<HTMLElement>(
      '.btn-primary, .btn-secondary, .veyra-retro-subdock__cell, [data-magnetic="true"]'
    )
  );

  const cleanups: Array<() => void> = [];

  targets.forEach((btn) => {
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.28, ease: 'power3.out' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.28, ease: 'power3.out' });

    const onMove = (e: MouseEvent) => {
      if ((btn as HTMLButtonElement).disabled) return;
      const rect = btn.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      const strength = btn.classList.contains('veyra-retro-subdock__cell') ? 0.14 : 0.22;
      xTo(relX * strength);
      yTo(relY * strength);
    };

    const onLeave = () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.45,
        ease: 'elastic.out(1, 0.4)',
        overwrite: 'auto',
      });
    };

    const onDown = () => {
      if ((btn as HTMLButtonElement).disabled) return;
      gsap.to(btn, {
        scale: 0.96,
        duration: 0.09,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    const onUp = () => {
      if ((btn as HTMLButtonElement).disabled) return;
      gsap.to(btn, {
        scale: 1,
        duration: 0.32,
        ease: 'back.out(2.4)',
        overwrite: 'auto',
      });
    };

    btn.addEventListener('mousemove', onMove);
    btn.addEventListener('mouseleave', onLeave);
    btn.addEventListener('mousedown', onDown);
    btn.addEventListener('mouseup', onUp);

    cleanups.push(() => {
      btn.removeEventListener('mousemove', onMove);
      btn.removeEventListener('mouseleave', onLeave);
      btn.removeEventListener('mousedown', onDown);
      btn.removeEventListener('mouseup', onUp);
      gsap.set(btn, { clearProps: 'x,y,scale' });
    });
  });

  return () => {
    cleanups.forEach((fn) => fn());
  };
}

/**
 * Attaches subtle 3D mouse-reactive tilt and radial cursor spotlight coordinates (--mouse-x, --mouse-y)
 * to dashboard panels and model cards without hindering click usability.
 */
export function attachCyberCardPhysics(rootEl: HTMLElement | null): () => void {
  if (!rootEl || prefersReducedMotion()) return () => {};

  const cards = Array.from(
    rootEl.querySelectorAll<HTMLElement>('.mr-card, .flippable-card-container, [data-cyber-card="true"]')
  );

  const cleanups: Array<() => void> = [];

  cards.forEach((card) => {
    card.classList.add('gsap-cyber-spotlight');
    const isLargePanel = card.offsetWidth > 540 || card.offsetHeight > 420;
    const maxTilt = isLargePanel ? 1.15 : 2.8;

    const rotXTo = gsap.quickTo(card, 'rotationX', { duration: 0.35, ease: 'power2.out' });
    const rotYTo = gsap.quickTo(card, 'rotationY', { duration: 0.35, ease: 'power2.out' });

    const onMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${px}px`);
      card.style.setProperty('--mouse-y', `${py}px`);

      const normX = (px / rect.width - 0.5) * 2;
      const normY = (py / rect.height - 0.5) * 2;
      gsap.set(card, { transformPerspective: 1100 });
      rotXTo(-normY * maxTilt);
      rotYTo(normX * maxTilt);
    };

    const onLeave = () => {
      rotXTo(0);
      rotYTo(0);
    };

    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);

    cleanups.push(() => {
      card.removeEventListener('mousemove', onMove);
      card.removeEventListener('mouseleave', onLeave);
      gsap.set(card, { clearProps: 'rotationX,rotationY,transformPerspective' });
    });
  });

  return () => {
    cleanups.forEach((fn) => fn());
  };
}

/**
 * Animates SVG paths/shapes inside a container using stroke-dasharray / stroke-dashoffset.
 */
export function animateSvgStrokes(rootEl: HTMLElement | null, delay = 0): void {
  if (!rootEl || prefersReducedMotion()) return;

  const paths = rootEl.querySelectorAll<SVGGeometryElement>(
    'svg [data-gsap-stroke], svg.gsap-svg-draw path, svg.gsap-svg-draw circle, svg.gsap-svg-draw polyline, svg.gsap-svg-draw rect'
  );

  paths.forEach((geom, idx) => {
    try {
      const length = typeof geom.getTotalLength === 'function' ? geom.getTotalLength() : 120;
      gsap.fromTo(
        geom,
        { strokeDasharray: length, strokeDashoffset: length },
        {
          strokeDashoffset: 0,
          duration: 0.75,
          delay: delay + idx * 0.06,
          ease: 'power2.out',
        }
      );
    } catch {
      // Ignore non-measurable SVG elements
    }
  });
}
