// Coding helpers: JSON, encoders, slug, UUID, hashes, and basic HTML/CSS/JS tools.

// --- JSON ---

export function formatJson(text: string, indent = 2): string {
  const value = JSON.parse(text);
  return JSON.stringify(value, null, indent);
}

export function minifyJson(text: string): string {
  return JSON.stringify(JSON.parse(text));
}

export function validateJson(text: string): { valid: boolean; error?: string; line?: number } {
  try {
    JSON.parse(text);
    return { valid: true };
  } catch (err) {
    const message = (err as Error).message;
    const match = message.match(/line (\d+)/);
    return { valid: false, error: message, line: match ? Number(match[1]) : undefined };
  }
}

// --- UUID ---

export function uuidv4(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function uuidBulk(count: number, uppercase: boolean): string[] {
  return Array.from({ length: count }, () => (uppercase ? uuidv4().toUpperCase() : uuidv4()));
}

// --- URL / HTML encoders ---

export function urlEncode(text: string): string {
  return encodeURIComponent(text);
}

export function urlDecode(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    throw new Error("Malformed percent-encoding in input");
  }
}

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function htmlEncode(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => HTML_ENTITIES[ch]);
}

export function htmlDecode(text: string): string {
  const doc = new DOMParser().parseFromString(text, "text/html");
  return doc.documentElement.textContent ?? "";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// --- MD5 (RFC 1321) ---

function md5RotateLeft(x: number, n: number) {
  return ((x << n) | (x >>> (32 - n))) >>> 0;
}

export function md5(input: string): string {
  const M = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476];
  const K = Array.from({ length: 64 }, (_, i) => Math.abs(Math.sin(i + 1)) * 0x100000000 >>> 0);
  const s = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    bytes.push(c & 0xff, (c >>> 8) & 0xff, (c >>> 16) & 0xff, (c >>> 24) & 0xff);
  }
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  bytes.push(bitLen & 0xff, (bitLen >>> 8) & 0xff, (bitLen >>> 16) & 0xff, (bitLen >>> 24) & 0xff, 0, 0, 0, 0);
  for (let off = 0; off < bytes.length; off += 64) {
    const X: number[] = [];
    for (let i = 0; i < 16; i++) {
      X[i] = (bytes[off + i * 4] | (bytes[off + i * 4 + 1] << 8) | (bytes[off + i * 4 + 2] << 16) | (bytes[off + i * 4 + 3] << 24)) >>> 0;
    }
    let [a, b, c, d] = M;
    for (let i = 0; i < 64; i++) {
      let f: number, g: number;
      if (i < 16) { f = (b & c) | (~b & d); g = i; }
      else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
      else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * i) % 16; }
      const tmp = (d + md5RotateLeft((a + f + K[i] + X[g]) >>> 0, s[i])) >>> 0;
      d = c; c = b; b = (b + tmp) >>> 0; a = tmp;
    }
    M[0] = (M[0] + a) >>> 0;
    M[1] = (M[1] + b) >>> 0;
    M[2] = (M[2] + c) >>> 0;
    M[3] = (M[3] + d) >>> 0;
  }
  const wordToHex = (word: number) => {
    const little = ((word & 0xff) << 24) | ((word >>> 8) & 0xff) << 16 | ((word >>> 16) & 0xff) << 8 | ((word >>> 24) & 0xff);
    return (little >>> 0).toString(16).padStart(8, "0");
  };
  return M.map(wordToHex).join("");
}

// --- HTML / CSS / JS ---

export function minifyHtml(html: string): string {
  const noComments = html.replace(/<!--[\s\S]*?-->/g, "");
  return noComments.replace(/>\s+</g, "><").replace(/^\s+|\s+$/g, "").trim();
}

export function minifyCss(css: string): string {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return noComments.replace(/\s+/g, " ").replace(/\s*([{}:;,])\s*/g, "$1").trim();
}

export function minifyJs(code: string): string {
  let out = "";
  let i = 0;
  let inString: string | null = null;
  let inLineComment = false;
  let inBlockComment = false;
  const result: string[] = [];
  while (i < code.length) {
    const ch = code[i];
    const next = code[i + 1];
    if (inLineComment) {
      if (ch === "\n") { inLineComment = false; result.push("\n"); }
      i++;
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") { inBlockComment = false; i += 2; }
      else i++;
      continue;
    }
    if (inString) {
      result.push(ch);
      if (ch === "\\") { result.push(next ?? ""); i += 2; continue; }
      if (ch === inString) inString = null;
      i++;
      continue;
    }
    if (ch === "/" && next === "/") { inLineComment = true; i += 2; continue; }
    if (ch === "/" && next === "*") { inBlockComment = true; i += 2; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { inString = ch; result.push(ch); i++; continue; }
    result.push(ch);
    i++;
  }
  out = result.join("").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
  return out;
}

export function formatCss(css: string): string {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const tokens = noComments.replace(/([{};])/g, "$1\n").split("\n");
  let indent = 0;
  const lines: string[] = [];
  for (let raw of tokens) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("}")) indent = Math.max(0, indent - 1);
    lines.push("  ".repeat(indent) + line.replace(/\s*[{;]\s*$/, (m) => m).trim());
    if (line.endsWith("{")) indent++;
  }
  return lines.join("\n");
}

export function formatHtml(html: string): string {
  const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
  const tokens = html.replace(/></g, ">\n<").split("\n");
  let indent = 0;
  const lines: string[] = [];
  for (const raw of tokens) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const closeOnly = /^<\/[^>]+>$/.test(trimmed);
    if (closeOnly) indent = Math.max(0, indent - 1);
    const tagName = trimmed.match(/^<\/?([a-zA-Z][a-zA-Z0-9-]*)/);
    const isVoid = tagName ? voidTags.has(tagName[1].toLowerCase()) : false;
    const selfClosing = /\/>$/.test(trimmed);
    lines.push("  ".repeat(indent) + trimmed);
    if (!closeOnly && !isVoid && !selfClosing && trimmed.startsWith("<")) indent++;
  }
  return lines.join("\n");
}

// --- React Native shadow ---

export interface RnShadowOptions {
  depth: number;
  color: string;
  iosOpacity: number;
  androidElevation: number;
  spread?: number;
}

export function rnShadowStyle(o: RnShadowOptions): string {
  return [
    "shadowColor: '" + o.color + "',",
    "shadowOffset: { width: 0, height: " + Math.round(Math.max(1, o.depth / 2)) + " },",
    "shadowOpacity: " + o.iosOpacity + ",",
    "shadowRadius: " + Math.max(1, o.depth) + ",",
    "elevation: " + Math.max(1, o.androidElevation) + ",",
  ].join("\n  ");
}

export function jsObjectToInline(source: string): string {
  // minimal "style string" renderer used by RN shadow + CSS-like outputs
  return source;
}