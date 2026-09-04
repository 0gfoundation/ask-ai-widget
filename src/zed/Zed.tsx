import type { CSSProperties } from "react";

/**
 * Zed — the 0G Ask Zed character.
 *
 * One parametric SVG. Head, two glass ear domes, one visor, and two lights.
 * Everything Zed expresses is an eye shape; nothing else on the character
 * moves. The outline and the eyes are computed from the render size so the
 * small versions are not just shrunk: about one device pixel of outline at
 * 16px, two at 48px and above, and slightly larger eyes at 32px and under.
 *
 * Reference sheet: the "Meet Zed" board and the Claude Design canvas linked
 * from the README. Copy final values from the canvas into the constants
 * below; this file is the production source of truth.
 */

export const ZED_STATES = ["idle", "thinking", "answered", "error", "resting"] as const;
export type ZedState = (typeof ZED_STATES)[number];

export interface ZedProps {
  /** Expression. Default `"idle"`. */
  state?: ZedState;
  /** Rendered width and height in CSS px. Default `32`. */
  size?: number;
  /** Idle blink and thinking bounce. Default `true`; respects prefers-reduced-motion either way. */
  animate?: boolean;
  /** Accessible name. Default `"Zed"`. */
  title?: string;
  className?: string;
  style?: CSSProperties;
}

// Palette. Shell is a whisper off white so it holds on white grounds; the
// edge is a mid purple that reads as a line at small sizes without going
// heavy at large ones. Visor and ear domes share one glass colour.
export const ZED_COLORS = {
  shell: "#F3EEFA",
  edge: "#B29CDB",
  visor: "#1A1326",
  visorEdge: "#0E0A16",
  eye: "#D9B3FF",
  glow: "#B75FFF",
} as const;

// Frame is 120 x 120 user units. Eyes are centred on these points.
const CY = 67;
const LX = 45;
const RX = 75;

/** Outline width in user units that lands near 1 device px at 16, 2 px at 48+. */
export function zedStrokeWidth(size: number): number {
  const px = size <= 16 ? 1 : size <= 24 ? 1.3 : size <= 32 ? 1.6 : 2;
  return Math.min(3.2, (px * 120) / size);
}

/** Eye box in user units. Slightly larger under 32px so the lights still read. */
export function zedEyeBox(size: number): { w: number; h: number } {
  return size <= 32 ? { w: 11, h: 17 } : { w: 10, h: 15 };
}

const ANIMATION_CSS = `
.zed-blink{transform-origin:60px ${CY}px;animation:zed-blink 4.5s infinite}
@keyframes zed-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.08)}}
.zed-dot{animation:zed-bounce 1.1s ease-in-out infinite}
.zed-dot:nth-of-type(2){animation-delay:.15s}
.zed-dot:nth-of-type(3){animation-delay:.3s}
@keyframes zed-bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}
@media (prefers-reduced-motion:reduce){.zed-blink,.zed-dot{animation:none}}
`.trim();

function Eyes({ state, size, animate }: { state: ZedState; size: number; animate: boolean }) {
  const { eye, glow } = ZED_COLORS;
  const { w, h } = zedEyeBox(size);
  const glowStyle: CSSProperties = { filter: `drop-shadow(0 0 3px ${glow})` };
  const small = size <= 32;

  switch (state) {
    case "thinking":
      return (
        <g fill={eye} style={glowStyle}>
          <circle className={animate ? "zed-dot" : undefined} cx={LX} cy={CY} r={3.6} />
          <circle className={animate ? "zed-dot" : undefined} cx={60} cy={CY} r={3.6} />
          <circle className={animate ? "zed-dot" : undefined} cx={RX} cy={CY} r={3.6} />
        </g>
      );
    case "answered":
      return (
        <g fill="none" stroke={eye} strokeWidth={small ? 5 : 4.4} strokeLinecap="round" style={glowStyle}>
          <path d={`M${LX - 7} ${CY + 3} Q${LX} ${CY - 7} ${LX + 7} ${CY + 3}`} />
          <path d={`M${RX - 7} ${CY + 3} Q${RX} ${CY - 7} ${RX + 7} ${CY + 3}`} />
        </g>
      );
    case "error": {
      const a = small ? 7 : 6.5;
      const cross = (cx: number) =>
        `M${cx - a} ${CY - a} L${cx + a} ${CY + a} M${cx + a} ${CY - a} L${cx - a} ${CY + a}`;
      return (
        <g fill="none" stroke={eye} strokeWidth={small ? 5 : 4.2} strokeLinecap="round" style={glowStyle}>
          <path d={cross(LX)} />
          <path d={cross(RX)} />
        </g>
      );
    }
    case "resting":
      return (
        <g fill={eye} opacity={0.85} style={glowStyle}>
          <rect x={LX - 7} y={CY} width={14} height={4.5} rx={2.25} />
          <rect x={RX - 7} y={CY} width={14} height={4.5} rx={2.25} />
        </g>
      );
    case "idle":
    default:
      return (
        <g fill={eye} className={animate ? "zed-blink" : undefined} style={glowStyle}>
          <rect x={LX - w / 2} y={CY - h / 2} width={w} height={h} rx={w / 2} />
          <rect x={RX - w / 2} y={CY - h / 2} width={w} height={h} rx={w / 2} />
        </g>
      );
  }
}

export function Zed({
  state = "idle",
  size = 32,
  animate = true,
  title = "Zed",
  className,
  style,
}: ZedProps) {
  const s = zedStrokeWidth(size);
  const { shell, edge, visor, visorEdge } = ZED_COLORS;
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={`${title}, ${state}`}
      data-zed-state={state}
      className={className}
      style={style}
    >
      {animate && <style>{ANIMATION_CSS}</style>}
      {/* Ear domes, drawn behind the head so only the tops show. */}
      <circle cx={27} cy={29} r={16} fill={visor} stroke={edge} strokeWidth={s} />
      <circle cx={93} cy={29} r={16} fill={visor} stroke={edge} strokeWidth={s} />
      <path d="M19 24 Q23 17 31 16" stroke="#fff" strokeWidth={2.6} fill="none" opacity={0.3} strokeLinecap="round" />
      <path d="M85 24 Q89 17 97 16" stroke="#fff" strokeWidth={2.6} fill="none" opacity={0.3} strokeLinecap="round" />
      {/* Head */}
      <circle cx={60} cy={64} r={44} fill={shell} stroke={edge} strokeWidth={s} />
      {/* Visor */}
      <rect x={24} y={44} width={72} height={46} rx={23} fill={visor} stroke={visorEdge} strokeWidth={s} />
      <Eyes state={state} size={size} animate={animate} />
      {/* Visor sheen */}
      <path d="M32 54 Q38 47 52 47" stroke="#fff" strokeWidth={3} fill="none" opacity={0.35} strokeLinecap="round" />
    </svg>
  );
}

export default Zed;
