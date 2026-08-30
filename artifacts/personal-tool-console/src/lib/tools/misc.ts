// Miscellaneous pure helpers: list shuffle, barcode encoders, fake IBAN.

export function shuffleList(text: string): string {
  const items = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items.join("\n");
}

// --- Code 39 barcode (full ASCII 43-char alphabet) ---

const CODE39: Array<[string, string]> = [
  ["0", "nnnwwnwnn"], ["1", "wnnwnnnnw"], ["2", "nnwwnnnnw"], ["3", "wnwwnnnnn"],
  ["4", "nnnwwnnnw"], ["5", "wnnwwnnnn"], ["6", "nnwwwnnnn"], ["7", "nnnwnnwnw"],
  ["8", "wnnwnnwnn"], ["9", "nnwwnnwnn"], ["A", "wnnnnwnnw"], ["B", "nnwnnwnnw"],
  ["C", "wnwnnwnnn"], ["D", "nnnnwwnnw"], ["E", "wnnnwwnnn"], ["F", "nnwnwwnnn"],
  ["G", "nnnnnwwnw"], ["H", "wnnnnwwnn"], ["I", "nnwnnwwnn"], ["J", "nnnnwwwnn"],
  ["K", "wnnnnnnww"], ["L", "nnwnnnnww"], ["M", "wnwnnnnwn"], ["N", "nnnnwnnww"],
  ["O", "wnnnwnnwn"], ["P", "nnwnwnnwn"], ["Q", "nnnnnnwww"], ["R", "wnnnnnwwn"],
  ["S", "nnwnnnwwn"], ["T", "nnnnwnwwn"], ["U", "wwnnnnnnw"], ["V", "nwwnnnnnw"],
  ["W", "wwwnnnnnn"], ["X", "nwnnwnnnw"], ["Y", "wwnnwnnnn"], ["Z", "nwwnwnnnn"],
  ["-", "nwnnnnwnw"], [".", "wwnnnnwnn"], [" ", "nwwnnnwnn"], ["$", "nwnwnwnnn"],
  ["/", "nwnwnnnwn"], ["+", "nwnnnwnwn"], ["%", "nnnwnwnwn"],
];

const CODE39_BY_CODE = new Map(CODE39.map(([ch, code]) => [ch, code]));
const CODE39_BY_PATTERN = new Map(CODE39.map(([ch, code]) => [code, ch]));

export function code39Encode(text: string): { svg: string; width: number; valid: boolean; error?: string } {
  const upper = text.toUpperCase();
  const unknown = [...upper].find((ch) => !CODE39_BY_CODE.has(ch));
  if (unknown) {
    return {
      svg: "",
      width: 0,
      valid: false,
      error: `Code 39 cannot encode "${unknown}" — allowed: A–Z, 0–9, space and - . $ / + %`,
    };
  }
  const patterns = ["*", ...upper.split(""), "*"].map((ch) => CODE39_BY_CODE.get(ch)!);
  const BARS = patterns.join("0"); // '0' = inter-character narrow gap
  const moduleW = 2;
  let x = 0;
  const rects = BARS.split("").map((bit, i) => {
    if (bit === "0") {
      x += moduleW;
      return null;
    }
    const wide = bit === "W";
    const w = (wide ? 3 : 1) * moduleW;
    const r = { x, w };
    x += w;
    return r;
  }).filter((r): r is { x: number; w: number } => r !== null);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x + 10} 60" role="img" aria-label="${text}">${rects
    .map((r) => `<rect x="${r.x + 5}" y="4" width="${r.w}" height="44" />`)
    .join("")}</svg>`;
  return { svg, width: x + 10, valid: true };
}

// --- EAN-13 ---

const EAN_L_CODE = [
  "0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011",
];
const EAN_G_CODE = [
  "0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111",
];
const EAN_R_CODE = EAN_L_CODE.map((c) => c.split("").reverse().join(""));
const EAN_FIRST: Record<string, string[]> = {
  "0": ["L", "L", "L", "L", "L", "L"], "1": ["L", "L", "G", "L", "G", "G"], "2": ["L", "L", "G", "G", "L", "G"],
  "3": ["L", "L", "G", "G", "G", "L"], "4": ["L", "G", "L", "L", "G", "G"], "5": ["L", "G", "G", "L", "L", "G"],
  "6": ["L", "G", "G", "G", "L", "L"], "7": ["L", "G", "L", "G", "L", "G"], "8": ["L", "G", "L", "G", "G", "L"],
  "9": ["L", "G", "G", "L", "G", "L"],
};

export function ean13(input: string): { svg: string; width: number; valid: boolean; error?: string } {
  let digits = input.replace(/\s+/g, "").replace(/^698/, "").replace(/[^0-9]/g, "");
  if (digits.length === 12) {
    let odd = 0, even = 0;
    for (let i = 0; i < 12; i++) {
      const v = Number(digits[i]);
      if (i % 2 === 0) odd += v;
      else even += v;
    }
    const check = (10 - ((odd + even * 3) % 10)) % 10;
    digits += String(check);
  }
  if (digits.length !== 13) return { svg: "", width: 0, valid: false, error: "Enter 12 digits to auto-compute a checksum, or the full 13-digit EAN." };

  const chars = digits.split("");
  const patterns = [EAN_R_CODE[Number(chars[12])], ...EAN_FIRST[chars[0]].map((kind, i) => {
    const d = Number(chars[i + 1]);
    return kind === "L" ? EAN_L_CODE[d] : EAN_G_CODE[d];
  }), ...chars.slice(7, 12).map((c) => EAN_R_CODE[Number(c)])];
  const full = patterns.join("");
  const moduleW = 2;
  let x = 0;
  const rects = full.split("").map((bit, i) => {
    if (bit === "0") { x += moduleW; return null; }
    const r = { x, w: moduleW };
    x += moduleW;
    return r;
  }).filter((r): r is { x: number; w: number } => r !== null);
  const total = x + 14;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} 80" role="img" aria-label="${digits}">${rects
    .map((r) => `<rect x="${r.x + 7}" y="6" width="${r.w}" height="50" />`)
    .join("")}</svg>`;
  return { svg, width: total, valid: true };
}

// --- Fake IBAN (checksum-correct, structure-valid) ---

const IBAN_COUNTRIES: Array<{ code: string; length: number; bban: string }> = [
  { code: "AE", length: 23, bban: "210000000000000000001" },
  { code: "BE", length: 16, bban: "539007547034" },
  { code: "CH", length: 21, bban: "9300762011623852957" },
  { code: "DE", length: 22, bban: "370400440532013000" },
  { code: "ES", length: 24, bban: "9120950800330001117834" },
  { code: "FR", length: 27, bban: "3000300030003003082901575" },
  { code: "GB", length: 22, bban: "NWBK60161331926819" },
  { code: "IT", length: 27, bban: "X0542811101000000123456" },
  { code: "NL", length: 18, bban: "ABNA0417164300" },
  { code: "SG", length: 18, bban: "DBS0011010021769127" },
  { code: "SE", length: 24, bban: "8000123456789012345678" },
  { code: "US", length: 27, bban: "0210000210000001234567" },
];

function replaceAlpha(code: string): string {
  return code.split("").map((ch) => (ch >= "A" && ch <= "Z" ? String(ch.charCodeAt(0) - 55) : ch)).join("");
}

function ibanChecksum(country: string, bban: string): string {
  const moved = bban + country + "00";
  const numeric = replaceAlpha(moved);
  const remainder = numeric.split("").reduce((acc, digit) => (acc * 10 + Number(digit)) % 97, 0);
  const check = (98 - remainder) % 97;
  return String(check).padStart(2, "0");
}

export function fakeIban(countryCode: string, seed: number): string {
  const country = IBAN_COUNTRIES.find((c) => c.code === countryCode) ?? IBAN_COUNTRIES[0];
  const targetLen = country.length - 4;
  let bban = country.bban.slice(0, targetLen);
  if (bban.length < targetLen) {
    const digits = "0123456789";
    const fill = Array.from({ length: targetLen - bban.length }, (_, i) => digits[(seed + (i + 1) * 3) % 10]).join("");
    bban += fill;
  }
  const check = ibanChecksum(country.code, bban);
  const iban = country.code + check + bban;
  const spaced = iban.match(/.{1,4}/g)?.join(" ") ?? iban;
  return spaced;
}

export function validateIbanFormat(iban: string): boolean {
  const cleaned = iban.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(cleaned)) return false;
  const moved = cleaned.slice(4) + cleaned.slice(0, 4);
  const numeric = replaceAlpha(moved);
  const remainder = numeric.split("").reduce((acc, digit) => (acc * 10 + Number(digit)) % 97, 0);
  return remainder === 1;
}