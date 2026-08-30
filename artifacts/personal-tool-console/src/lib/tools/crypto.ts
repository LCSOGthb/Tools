// Client-side crypto via Web Crypto API. No keys or plaintext leave the browser.

export type AesMode = "AES-GCM" | "AES-CBC";

export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function utf8Encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function toBuf(u8: Uint8Array): Uint8Array<ArrayBuffer> {
  return new Uint8Array(u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer);
}

export function utf8Decode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function deriveIv(mode: AesMode, ivInput: string): Uint8Array<ArrayBuffer> {
  const raw = ivInput || "";
  let bytes = new TextEncoder().encode(raw);
  const len = mode === "AES-GCM" ? 12 : 16;
  if (bytes.length >= len) bytes = bytes.slice(0, len);
  const out = new Uint8Array(len);
  out.fill(0);
  out.set(bytes);
  return out;
}

async function aesImportKey(keyB64: string, mode: AesMode) {
  const raw = toBuf(base64ToBytes(keyB64));
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: mode, length: raw.length * 8 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function aesEncrypt(text: string, keyB64: string, ivInput: string, mode: AesMode) {
  const key = await aesImportKey(keyB64, mode);
  const iv = deriveIv(mode, ivInput);
  const buf = await crypto.subtle.encrypt({ name: mode, iv }, key, toBuf(utf8Encode(text)));
  return bytesToBase64(new Uint8Array(buf));
}

export async function aesDecrypt(b64: string, keyB64: string, ivInput: string, mode: AesMode) {
  try {
    const key = await aesImportKey(keyB64, mode);
    const iv = deriveIv(mode, ivInput);
    const buf = await crypto.subtle.decrypt({ name: mode, iv }, key, toBuf(base64ToBytes(b64)));
    return utf8Decode(new Uint8Array(buf));
  } catch {
    throw new Error("Decryption failed — wrong key, IV, or corrupted ciphertext");
  }
}

export function generateAesKey(bits: number, format: "base64" | "hex") {
  const bytes = randomBytes(bits / 8);
  return format === "hex"
    ? Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")
    : bytesToBase64(bytes);
}

export async function hmacHash(message: string, secret: string, algo: "SHA-256" | "SHA-384" | "SHA-512") {
  const key = await crypto.subtle.importKey(
    "raw",
    toBuf(utf8Encode(secret)),
    { name: "HMAC", hash: algo },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, toBuf(utf8Encode(message)));
  const bytes = new Uint8Array(sig);
  return {
    hex: Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join(""),
    base64: bytesToBase64(bytes),
  };
}

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  expiry?: string;
  issuedAt?: string;
  secondsToExpiry?: number;
  expired?: boolean;
}

export function decodeJwt(token: string): DecodedJwt {
  const parts = token.trim().split(".");
  if (parts.length !== 3) throw new Error("A JWT has exactly 3 dot-separated segments: header.payload.signature");
  const b64urlToObj = (seg: string) => {
    const normalized = seg.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    try {
      return JSON.parse(decodeURIComponent(escape(atob(padded)))) as Record<string, unknown>;
    } catch {
      throw new Error("Invalid base64url JSON segment");
    }
  };
  const header = b64urlToObj(parts[0]);
  const payload = b64urlToObj(parts[1]);
  const exp = typeof payload.exp === "number" ? payload.exp * 1000 : undefined;
  const iat = typeof payload.iat === "number" ? payload.iat * 1000 : undefined;
  const secondsToExpiry = exp ? Math.floor((exp - Date.now()) / 1000) : undefined;
  return {
    header,
    payload,
    signature: parts[2],
    expiry: exp ? new Date(exp).toLocaleString() : undefined,
    issuedAt: iat ? new Date(iat).toLocaleString() : undefined,
    secondsToExpiry,
    expired: secondsToExpiry !== undefined ? secondsToExpiry <= 0 : undefined,
  };
}

export function generateRandomKey(bits: 128 | 192 | 256 | 512, format: "hex" | "base64") {
  if (![128, 192, 256, 512].includes(bits)) throw new Error("Supported sizes: 128/192/256/512 bits");
  const bytes = randomBytes(bits / 8);
  return format === "hex"
    ? Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")
    : bytesToBase64(bytes);
}