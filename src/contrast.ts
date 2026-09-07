// Derives the widget's accent-based colours from whatever accent a host
// passes, so they stay legible in both themes. Three outputs:
//
//   surface  the accent as used for filled elements (user bubble, send
//            button), nudged towards ink or paper until it reaches 3:1
//            against the theme background (WCAG's threshold for UI parts)
//   onSurface  ink or white, whichever reads better on that surface
//   text     the accent as used for text on the background (links, footer),
//            nudged until it reaches 4.5:1
//
// An accent that already passes is used as given, so hosts get their colour
// whenever it works and the nearest legible neighbour when it doesn't.

export type RGB = [number, number, number];

export const INK: RGB = [20, 16, 32]; // #141020
export const PAPER: RGB = [255, 255, 255];

const BACKGROUND: Record<"light" | "dark", RGB> = {
  light: [250, 250, 250], // matches --aai-bg in widget.css
  dark: [0, 0, 0],
};

function clamp(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

/** Parses hex (#rgb, #rrggbb, #rrggbbaa) without a DOM; anything else falls back to the browser. */
export function parseColor(input: string): RGB | null {
  const s = input.trim();
  const hex = /^#([0-9a-f]{3,8})$/i.exec(s);
  if (hex) {
    const h = hex[1];
    if (h.length === 3 || h.length === 4) {
      return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
    }
    if (h.length === 6 || h.length === 8) {
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    return null;
  }
  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(s);
  if (rgb) return [clamp(+rgb[1]), clamp(+rgb[2]), clamp(+rgb[3])];
  if (typeof document === "undefined") return null;
  // Canvas normalises any valid CSS colour (named, hsl(), oklch(), ...).
  try {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#000";
    ctx.fillStyle = s;
    const out = String(ctx.fillStyle);
    if (out === "#000000" && !/^(#0{3,8}|black|rgba?\(\s*0[\s,]+0[\s,]+0)/i.test(s)) return null;
    return parseColor(out);
  } catch {
    return null;
  }
}

function channel(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function luminance([r, g, b]: RGB): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: RGB, b: RGB): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [clamp(a[0] + (b[0] - a[0]) * t), clamp(a[1] + (b[1] - a[1]) * t), clamp(a[2] + (b[2] - a[2]) * t)];
}

/** Moves `color` towards ink or paper (whichever is further from `against`) until it reaches `target` contrast. */
export function ensureContrast(color: RGB, against: RGB, target: number): RGB {
  if (contrast(color, against) >= target) return color;
  const towards = luminance(against) > 0.5 ? INK : PAPER;
  for (let t = 0.05; t <= 1; t += 0.05) {
    const candidate = mix(color, towards, t);
    if (contrast(candidate, against) >= target) return candidate;
  }
  return towards;
}

function hex([r, g, b]: RGB): string {
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}

export interface AccentColors {
  surface: string;
  onSurface: string;
  text: string;
}

const FALLBACK: Record<"light" | "dark", AccentColors> = {
  light: { surface: "#B75FFF", onSurface: "#141020", text: "#7800BA" },
  dark: { surface: "#B75FFF", onSurface: "#141020", text: "#B75FFF" },
};

export function deriveAccentColors(accent: string, theme: "light" | "dark"): AccentColors {
  const rgb = parseColor(accent);
  if (!rgb) return FALLBACK[theme];
  const bg = BACKGROUND[theme];
  const surface = ensureContrast(rgb, bg, 3);
  const onSurface = contrast(INK, surface) >= contrast(PAPER, surface) ? INK : PAPER;
  const text = ensureContrast(rgb, bg, 4.5);
  return { surface: hex(surface), onSurface: hex(onSurface), text: hex(text) };
}
