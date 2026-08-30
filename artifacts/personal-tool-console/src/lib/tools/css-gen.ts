// CSS snippet generators — pure functions returning CSS strings.
// Components render live previews using these outputs.

export interface CssGenResult {
  css: string;
  html?: string;
}

export function cssGradient(kind: "linear" | "radial" | "conic", angle: number, stops: string[], position: string): CssGenResult {
  const stopStr = stops.join(", ");
  let value = "";
  if (kind === "linear") value = `${kind}-gradient(${angle}deg, ${stopStr})`;
  else if (kind === "radial") value = `radial-gradient(circle at ${position}, ${stopStr})`;
  else value = `conic-gradient(from ${angle}deg at ${position}, ${stopStr})`;
  return { css: `.gradient {\n  background: ${value};\n}` };
}

export function cssGlassmorphism(blur: number, opacity: number, border: string, radius: number, color: string): CssGenResult {
  return {
    css: `.glass {\n  background: ${color};\n  backdrop-filter: blur(${blur}px);\n  -webkit-backdrop-filter: blur(${blur}px);\n  border: ${border} solid rgba(255,255,255,0.6);\n  border-radius: ${radius}px;\n  opacity: 0.${Math.round(opacity * 10)};\n}`,
  };
}

export function cssTriangle(direction: "up" | "down" | "left" | "right", size: number, color: string): CssGenResult {
  const borders: Record<string, string> = {
    up: `border-left: ${size}px solid transparent;\n  border-right: ${size}px solid transparent;\n  border-bottom: ${size}px solid ${color};`,
    down: `border-left: ${size}px solid transparent;\n  border-right: ${size}px solid transparent;\n  border-top: ${size}px solid ${color};`,
    left: `border-top: ${size}px solid transparent;\n  border-bottom: ${size}px solid transparent;\n  border-right: ${size}px solid ${color};`,
    right: `border-top: ${size}px solid transparent;\n  border-bottom: ${size}px solid transparent;\n  border-left: ${size}px solid ${color};`,
  };
  return {
    css: `.triangle {\n  width: 0;\n  height: 0;\n  ${borders[direction]}\n}`,
    html: `<div class="triangle"></div>`,
  };
}

export function cssBoxShadow(spreads: Array<{ x: number; y: number; blur: number; grow: number; color: string; inset: boolean }>): CssGenResult {
  const parts = spreads.map((s) => `${s.inset ? "inset " : ""}${s.x}px ${s.y}px ${s.blur}px ${s.grow}px ${s.color}`).join(", ");
  return { css: `.box {\n  box-shadow: ${parts};\n}` };
}

export function cssBorderRadius(topLeft: number, topRight: number, bottomRight: number, bottomLeft: number, squircle: boolean): CssGenResult {
  if (squircle) {
    return { css: `.squircle {\n  border-radius: 40% 40% 40% 40% / 30% 30% 30% 30%;\n}` };
  }
  return {
    css: `.rounded {\n  border-radius: ${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px;\n}`,
  };
}

export function cssRgbBackgroundPattern(kind: "dots" | "stripes" | "grid" | "checker" | "crosshatch", size: number, color: string, bg: string): CssGenResult {
  const c = color;
  const transparent = "rgba(0,0,0,0)";
  let gradient = "";
  switch (kind) {
    case "dots":
      gradient = `radial-gradient(${c} ${size / 5}px, ${transparent} ${size / 5}px);\n  background-size: ${size}px ${size}px;`;
      break;
    case "stripes":
      gradient = `repeating-linear-gradient(45deg, ${c} 0, ${c} ${size / 5}px, ${transparent} ${size / 5}px, ${transparent} ${size}px);`;
      break;
    case "grid":
      gradient = `linear-gradient(${c} 1px, ${transparent} 1px), linear-gradient(90deg, ${c} 1px, ${transparent} 1px);\n  background-size: ${size}px ${size}px;`;
      break;
    case "checker":
      gradient = `linear-gradient(${c} 0 50%, ${transparent} 0 50%, ${transparent} 100%), linear-gradient(90deg, ${c} 0 50%, ${transparent} 0 50%, ${transparent} 100%);\n  background-size: ${size}px ${size}px;`;
      break;
    default:
      gradient = `repeating-linear-gradient(45deg, ${c} 0 1px, ${transparent} 1px ${size}px), repeating-linear-gradient(-45deg, ${c} 0 1px, ${transparent} 1px ${size}px);`;
  }
  return { css: `.pattern {\n  background: ${bg};\n  background-image: ${gradient}\n}` };
}

export function cssClipPath(slug: "circle" | "ellipse" | "triangle" | "hexagon" | "star" | "custom", points: Array<[number, number]>): CssGenResult {
  const shapes: Record<string, string> = {
    circle: "circle(50% at 50% 50%)",
    ellipse: "ellipse(25% 40% at 50% 50%)",
    triangle: "polygon(50% 0%, 0% 100%, 100% 100%)",
    hexagon: "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)",
    star: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
  };
  const value = slug === "custom" ? `polygon(${points.map(([x, y]) => `${x}% ${y}%`).join(", ")})` : shapes[slug];
  return { css: `.clipped {\n  clip-path: ${value};\n}` };
}

export function cssCubicBezier(p1x: number, p1y: number, p2x: number, p2y: number): CssGenResult {
  return { css: `.ease {\n  transition: all 0.4s cubic-bezier(${p1x}, ${p1y}, ${p2x}, ${p2y});\n}` };
}

export function cssLoader(kind: "ring" | "dual" | "bar" | "dots", color: string, size: number, speed: number): CssGenResult {
  const base = `@keyframes spin { to { transform: rotate(360deg); } }\n@keyframes pulse { 0%,100% { opacity: 0.2 } 50% { opacity: 1 } }`;
  let css = "";
  switch (kind) {
    case "ring":
      css = `.loader {\n  width: ${size}px;\n  height: ${size}px;\n  border: 4px solid ${color}33;\n  border-top-color: ${color};\n  border-radius: 50%;\n  animation: spin ${speed}s linear infinite;\n}`;
      break;
    case "dual":
      css = `.loader {\n  width: ${size}px;\n  height: ${size}px;\n  border: 4px solid ${color};\n  border-radius: 50%;\n  animation: spin ${speed}s linear infinite;\n  border-left-color: transparent;\n}`;
      break;
    case "bar":
      css = `.loader {\n  width: ${size}px;\n  height: ${size}px;\n  background: ${color};\n  animation: pulse ${speed}s ease-in-out infinite;\n}`;
      break;
    default:
      css = `.loader {\n  display: flex;\n  gap: 6px;\n}\n.loader span {\n  width: ${Math.round(size / 4)}px;\n  height: ${Math.round(size / 4)}px;\n  border-radius: 50%;\n  background: ${color};\n  animation: pulse ${speed}s ease-in-out infinite;\n}\n.loader span:nth-child(2) { animation-delay: 0.15s }\n.loader span:nth-child(3) { animation-delay: 0.3s }`;
  }
  return { css: `${base}\n\n${css}` };
}

export function cssSwitch(color: string, size: number, checked: boolean): CssGenResult {
  return {
    css: `.switch {\n  position: relative;\n  display: inline-block;\n  width: ${Math.round(size * 1.7)}px;\n  height: ${size}px;\n  border-radius: ${size}px;\n  background: ${checked ? color : "#ccc"};\n  transition: 0.2s;\n}\n.switch::after {\n  content: "";\n  position: absolute;\n  top: 3px;\n  left: 3px;\n  width: ${size - 6}px;\n  height: ${size - 6}px;\n  border-radius: 50%;\n  background: #fff;\n  transition: 0.2s;\n  transform: ${checked ? `translateX(${Math.round(size * 0.7)}px)` : "none"};\n}`,
  };
}

export function cssCheckbox(color: string, size: number): CssGenResult {
  return {
    css: `.checkbox {\n  appearance: none;\n  width: ${size}px;\n  height: ${size}px;\n  border: 2px solid #999;\n  border-radius: 4px;\n  cursor: pointer;\n}\n.checkbox:checked {\n  background: ${color};\n  border-color: ${color};\n  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23fff' stroke-width='3' d='M6 10l3 3 5-6'/%3e%3c/svg%3e");\n}`,
  };
}

export function cssTextGlitch(colorA: string, colorB: string, intensity: number): CssGenResult {
  const offset = Math.max(1, intensity);
  return {
    css: `.glitch {\n  position: relative;\n}\n.glitch::before, .glitch::after {\n  content: attr(data-text);\n  position: absolute;\n  inset: 0;\n}\n.glitch::before {\n  color: ${colorA};\n  animation: glitch-a ${0.6 * (2 - intensity / 10)}s infinite linear alternate-reverse;\n  transform: translate(${offset}px, 0);\n}\n.glitch::after {\n  color: ${colorB};\n  animation: glitch-b ${0.4 * (2 - intensity / 10)}s infinite linear alternate-reverse;\n  transform: translate(-${offset}px, 0);\n}\n@keyframes glitch-a {\n  0% { clip-path: inset(0 0 85% 0) }\n  25% { clip-path: inset(15% 0 60% 0) }\n  50% { clip-path: inset(40% 0 40% 0) }\n  75% { clip-path: inset(60% 0 15% 0) }\n  100% { clip-path: inset(85% 0 0 0) }\n}\n@keyframes glitch-b {\n  0% { clip-path: inset(85% 0 0 0) }\n  25% { clip-path: inset(60% 0 15% 0) }\n  50% { clip-path: inset(40% 0 40% 0) }\n  75% { clip-path: inset(15% 0 60% 0) }\n  100% { clip-path: inset(0 0 85% 0) }\n}`,
  };
}