// Color utilities — pure conversion, mixing and palette generation.

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export function normalizeHex(input: string): string {
  let hex = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(hex)) hex = hex.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) throw new Error("Expected a hex color like #RRGGBB");
  return hex.toLowerCase();
}

export function hexToRgb(hex: string): Rgb {
  const h = normalizeHex(hex);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function hexToRgbaString(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function isRgba(value: string): boolean {
  return /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.test(value.trim());
}

export function rgbaToRgb(value: string): { rgb: Rgb; alpha: number } {
  const m = value.trim().match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
  if (!m) throw new Error("Expected an rgb()/rgba() value");
  return {
    rgb: { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) },
    alpha: m[4] !== undefined ? Number(m[4]) : 1,
  };
}

export function rgbaToHex(value: string): string {
  const { rgb, alpha } = rgbaToRgb(value);
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");
  const base = `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  if (alpha < 1) {
    const a = Math.round(alpha * 255).toString(16).padStart(2, "0");
    return `${base}${a}`;
  }
  return base;
}

export function rgbToHex(rgb: Rgb): string {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h * 60, s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  h = ((h % 360) + 360) % 360;
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function mixColors(a: string, b: string, ratio = 0.5): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const r = Math.round(ca.r + (cb.r - ca.r) * ratio);
  const g = Math.round(ca.g + (cb.g - ca.g) * ratio);
  const bl = Math.round(ca.b + (cb.b - ca.b) * ratio);
  return rgbToHex({ r, g: g, b: bl });
}

export function shadeStep(hex: string, percent: number): string {
  const { h, s, l } = rgbToHsl(hexToRgb(hex));
  const clamped = Math.max(0, Math.min(100, l + percent));
  return rgbToHex(hslToRgb({ h, s, l: clamped }));
}

export function shadeScale(hex: string, steps = 10): string[] {
  const out: string[] = [];
  for (let i = 0; i < steps; i++) {
    const t = steps === 1 ? 0 : (i / (steps - 1)) * 100;
    out.push(shadeStep(hex, t - 50));
  }
  return out;
}

export type PaletteScheme = "monochromatic" | "complementary" | "analogous" | "triadic" | "tetradic";

export function generatePalette(seedHex: string, scheme: PaletteScheme, count = 5): string[] {
  const { h, s, l } = rgbToHsl(hexToRgb(seedHex));
  const hues = (): number[] => {
    switch (scheme) {
      case "monochromatic": return Array.from({ length: count }, (_, i) => h);
      case "complementary": return Array.from({ length: count }, (_, i) => h + (i % 2 === 0 ? 0 : 180));
      case "analogous": return Array.from({ length: count }, (_, i) => h + (i - Math.floor(count / 2)) * 30);
      case "triadic": return Array.from({ length: count }, (_, i) => h + (i % 3) * 120);
      case "tetradic": return Array.from({ length: count }, (_, i) => h + (i % 4) * 90);
    }
  };
  const hslValues = (): Hsl[] => {
    const hs = hues();
    return hs.map((hh, i) => {
      const lt = scheme === "monochromatic" ? 25 + (i / Math.max(count - 1, 1)) * 50 : Math.max(35, Math.min(70, l + (i % 2 === 0 ? 0 : 12)));
      const st = scheme === "monochromatic" ? Math.max(40, s - 10) : Math.max(45, s);
      return { h: hh, s: st, l: lt };
    });
  };
  return hslValues().map((x) => rgbToHex(hslToRgb(x)));
}

export function randomHexColor(): string {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  return rgbToHex({ r: bytes[0], g: bytes[1], b: bytes[2] });
}