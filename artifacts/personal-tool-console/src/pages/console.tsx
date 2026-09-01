import React, { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useSearch } from "wouter";
import { loadJson, saveJson, STORAGE_KEYS, DEFAULT_PREFS } from "@/lib/storage";

const UNIT_TABLE: Record<string, Record<string, number>> = {
  length: {
    mm: 0.001,
    cm: 0.01,
    m: 1,
    km: 1000,
    in: 0.0254,
    ft: 0.3048,
    yd: 0.9144,
    mi: 1609.344,
  },
  mass: {
    mg: 0.000001,
    g: 0.001,
    kg: 1,
    oz: 0.028349523125,
    lb: 0.45359237,
  },
  speed: {
    "m/s": 1,
    "km/h": 1000 / 3600,
    mph: 1609.344 / 3600,
    knot: 1852 / 3600,
  },
  area: {
    m2: 1,
    cm2: 0.0001,
    km2: 1_000_000,
    acre: 4046.8564224,
    ha: 10_000,
  },
  volume: {
    ml: 0.000001,
    l: 0.001,
    m3: 1,
    tsp: 0.00000492892159375,
    tbsp: 0.00001478676478125,
    cup: 0.0002365882365,
    fl_oz: 0.0000295735295625,
    gal: 0.003785411784,
  },
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  usd: "$",
  myr: "RM",
  eur: "€",
  gbp: "£",
  jpy: "¥",
  sgd: "S$",
  aud: "A$",
  idr: "Rp",
};

const COMMAND_EXAMPLES = [
  "100 usd to myr",
  "10 km to mi",
  "16 * 24 + 10",
  "gen password 16 strong",
  "qr https://example.com",
  "speed test",
  "dns lookup google.com",
  "base64 encode hello world",
  "base64 decode aGVsbG8gd29ybGQ=",
  "hash hello world",
  "timestamp",
  "timestamp 1700000000",
  "timestamp 2024-01-15",
];

function suggestionDescription(s: string) {
  if (s.includes(" to "))
    return s.includes("usd") || s.includes("myr") || s.includes("eur")
      ? "Currency conversion"
      : "Unit conversion";
  if (s.includes("password")) return "Password generation";
  if (s.startsWith("qr")) return "QR generation";
  if (s.includes("speed")) return "Network test";
  if (s.startsWith("dns")) return "DNS lookup";
  if (s.startsWith("base64")) return "Base64 encode/decode";
  if (s.startsWith("hash")) return "Hash (SHA-1 / SHA-256 / SHA-512)";
  if (s.startsWith("timestamp")) return "Timestamp converter";
  return "Math expression";
}

function formatNumber(value: number, digits = 8) {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e9 || abs < 1e-6))
    return value.toExponential(6).replace(/\+/, "");
  return Number.parseFloat(value.toFixed(digits)).toString();
}

function normalize(input: string) {
  return input.trim().replace(/\s+/g, " ").toLowerCase();
}

function isMathExpression(input: string) {
  return /^[0-9+\-*/%^().,\s]+$/.test(input) && /\d/.test(input);
}

function safeMathEval(expression: string) {
  const cleaned = expression.replace(/,/g, ".").replace(/\^/g, "**");
  if (!/^[0-9+\-*/%().*\s**]+$/.test(cleaned.replace(/\*\*/g, "")))
    throw new Error("Invalid expression");
  // eslint-disable-next-line no-new-func
  const result = Function(`"use strict"; return (${cleaned});`)();
  if (typeof result !== "number" || !Number.isFinite(result))
    throw new Error("Invalid result");
  return result as number;
}

function parsePasswordCommand(input: string, prefs: typeof DEFAULT_PREFS) {
  const m = input.match(
    /^(?:gen\s+)?password(?:\s+(\d{1,3}))?(?:\s+(weak|medium|strong))?$/i,
  );
  if (!m) return null;
  return {
    type: "password",
    length: Math.max(
      4,
      Math.min(128, Number(m[1] || prefs.passwordLength || 16)),
    ),
    mode: (m[2] || prefs.passwordMode || "strong").toLowerCase(),
  };
}

function parseQrCommand(input: string) {
  if (!input.startsWith("qr ")) return null;
  const value = input.slice(3).trim();
  if (!value) return null;
  return { type: "qr", value };
}

function parseConversion(input: string, prefs: typeof DEFAULT_PREFS) {
  const currencyPattern =
    /^(?:(\d+(?:\.\d+)?)\s+)?([a-z]{3})\s+to\s+([a-z]{3})$/i;
  const unitPattern =
    /^(\d+(?:\.\d+)?)\s+([a-z\/0-9_]+)\s+to\s+([a-z\/0-9_]+)$/i;
  const cm = input.match(currencyPattern);
  if (cm) {
    return {
      type: "currency",
      value: cm[1] ? Number(cm[1]) : 1,
      from: cm[2].toLowerCase(),
      to: cm[3].toLowerCase(),
      note: "Rates are local/manual in this prototype.",
      prefs,
    };
  }
  const um = input.match(unitPattern);
  if (!um) return null;
  return {
    type: "unit",
    value: Number(um[1]),
    from: um[2].toLowerCase(),
    to: um[3].toLowerCase(),
  };
}

function findUnitCategory(unit: string) {
  for (const [category, map] of Object.entries(UNIT_TABLE)) {
    if (Object.prototype.hasOwnProperty.call(map, unit)) return category;
  }
  return null;
}

function convertUnits(value: number, from: string, to: string) {
  const category = findUnitCategory(from);
  if (!category || findUnitCategory(to) !== category)
    throw new Error("Unsupported unit pair");
  const base = value * UNIT_TABLE[category][from];
  return base / UNIT_TABLE[category][to];
}

function convertCurrency(value: number, from: string, to: string) {
  const rates: Record<string, number> = {
    usd: 1,
    myr: 4.7,
    eur: 0.92,
    gbp: 0.78,
    jpy: 154,
    sgd: 1.35,
    aud: 1.51,
    idr: 15850,
  };
  if (!rates[from] || !rates[to]) throw new Error("Unsupported currency");
  return (value / rates[from]) * rates[to];
}

function randomPassword(length: number, mode: string) {
  const sets: Record<string, string> = {
    weak: "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789",
    medium: "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%?_-",
    strong:
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{};:,.<>/?",
  };
  const chars = sets[mode] || sets.strong;
  const bytes = new Uint32Array(length);
  window.crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  return out;
}

function strengthScore(pw: string) {
  let score = 0;
  if (pw.length >= 12) score++;
  if (pw.length >= 16) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

function resultLabel(type: string) {
  switch (type) {
    case "math":
      return "Calculator";
    case "unit":
      return "Unit converter";
    case "currency":
      return "Currency converter";
    case "password":
      return "Password generator";
    case "qr":
      return "QR generator";
    case "speed":
      return "Speed test";
    case "dns":
      return "DNS lookup";
    case "base64":
      return "Base64";
    case "hash":
      return "Hash";
    case "timestamp":
      return "Timestamp";
    default:
      return "Command";
  }
}

function parseTimestampCommand(
  input: string,
): { mode: "now" | "unix" | "date"; value: string } | null {
  const n = input.trim();
  if (n === "timestamp" || n === "timestamp now")
    return { mode: "now", value: "" };
  const unixM = n.match(/^timestamp\s+(\d{1,13})$/);
  if (unixM) return { mode: "unix", value: unixM[1] };
  const dateM = n.match(
    /^timestamp\s+(\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?)$/,
  );
  if (dateM) return { mode: "date", value: dateM[1] };
  return null;
}

function parseHashCommand(input: string): string | null {
  const m = input.match(/^hash\s+(.+)$/is);
  return m ? m[1] : null;
}

function parseBase64Command(
  input: string,
): { op: "encode" | "decode"; text: string } | null {
  const m = input.match(/^base64\s+(encode|decode)\s+(.+)$/is);
  if (!m) return null;
  return { op: m[1].toLowerCase() as "encode" | "decode", text: m[2] };
}

function parseDnsCommand(input: string): string | null {
  const m = input.match(/^dns(?:\s+lookup)?\s+([a-z0-9._-]+\.[a-z]{2,})$/i);
  return m ? m[1].toLowerCase() : null;
}

type Quality = { label: string; color: string };

function downloadQuality(mbps: string): Quality {
  const v = parseFloat(mbps);
  if (isNaN(v)) return { label: "—", color: "text-slate-400" };
  if (v >= 100) return { label: "Excellent", color: "text-cyan-400" };
  if (v >= 25) return { label: "Good", color: "text-green-400" };
  if (v >= 5) return { label: "Fair", color: "text-amber-400" };
  return { label: "Poor", color: "text-red-400" };
}

function uploadQuality(mbps: string): Quality {
  const v = parseFloat(mbps);
  if (isNaN(v)) return { label: "—", color: "text-slate-400" };
  if (v >= 50) return { label: "Excellent", color: "text-cyan-400" };
  if (v >= 10) return { label: "Good", color: "text-green-400" };
  if (v >= 2) return { label: "Fair", color: "text-amber-400" };
  return { label: "Poor", color: "text-red-400" };
}

function pingQuality(ms: string): Quality {
  const v = parseFloat(ms);
  if (isNaN(v)) return { label: "—", color: "text-slate-400" };
  if (v < 20) return { label: "Excellent", color: "text-cyan-400" };
  if (v < 50) return { label: "Good", color: "text-green-400" };
  if (v < 100) return { label: "Fair", color: "text-amber-400" };
  return { label: "Poor", color: "text-red-400" };
}

function commandSuggestions(query: string) {
  const q = normalize(query);
  if (!q) return COMMAND_EXAMPLES;
  return COMMAND_EXAMPLES.filter((item) => item.includes(q)).slice(0, 6);
}

interface HistoryRecord {
  id: string;
  input: string;
  normalized: string;
  type: string;
  label: string;
  output: Record<string, unknown>;
  actions: string[];
  createdAt: string;
}

interface SpeedState {
  running: boolean;
  dl: string | null;
  ul: string | null;
  ping: string | null;
  message?: string;
}

interface DnsRecord {
  name: string;
  type: number;
  TTL: number;
  data: string;
}
interface DnsResponse {
  Status: number;
  Answer?: DnsRecord[];
}

export default function Console() {
  const search = useSearch();
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [input, setInput] = useState("");
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [result, setResult] = useState<HistoryRecord | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);
  const [status, setStatus] = useState("Ready");
  const [speedState, setSpeedState] = useState<SpeedState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prefilledRef = useRef(false);

  useEffect(() => {
    document.title = "Command Console · Toolbox";
  }, []);

  useEffect(() => {
    const storedPrefs = loadJson(STORAGE_KEYS.prefs, DEFAULT_PREFS);
    const storedHistory = loadJson(STORAGE_KEYS.history, []);
    const storedPins = loadJson(STORAGE_KEYS.pins, []);
    setPrefs({ ...DEFAULT_PREFS, ...storedPrefs });
    setHistory(Array.isArray(storedHistory) ? storedHistory : []);
    setPinned(Array.isArray(storedPins) ? storedPins : []);
  }, []);

  useEffect(() => saveJson(STORAGE_KEYS.prefs, prefs), [prefs]);
  useEffect(
    () => saveJson(STORAGE_KEYS.history, history.slice(0, 80)),
    [history],
  );
  useEffect(() => saveJson(STORAGE_KEYS.pins, pinned), [pinned]);

  useEffect(() => {
    if (prefilledRef.current) return;
    prefilledRef.current = true;
    if (!search) return;
    const params = new URLSearchParams(search);
    const raw = params.get("q");
    if (!raw) return;
    let query = raw;
    try {
      query = decodeURIComponent(raw);
    } catch {
      query = raw;
    }
    setInput(query);
    if (query.trim()) {
      const n = normalize(query);
      const dnsDomain = parseDnsCommand(n);
      const hashText = parseHashCommand(n);
      if (n === "speed test" || n === "speed") runSpeedTest();
      else if (dnsDomain) runDnsLookup(dnsDomain, query);
      else if (hashText) runHash(hashText, query);
      else executeCommand(query);
    }
  }, [search]);

  function addHistory(item: HistoryRecord) {
    setHistory((prev) => [item, ...prev].slice(0, 80));
  }

  function copyText(text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  function executeCommand(raw: string, options: { clearInput?: boolean } = {}) {
    const normalized = normalize(raw);
    if (!normalized) return;

    let output: Record<string, unknown> = {};
    let type = "unknown";
    let actions: string[] = [];

    try {
      if (normalized === "speed test" || normalized === "speed") {
        type = "speed";
        output = {
          title: "Speed test is scaffolded",
          details:
            "This prototype includes the UI and history, but a true browser speed test needs a test file or backend endpoint you control.",
        };
        setSpeedState({ running: false, dl: null, ul: null, ping: null });
        actions = ["configure speed endpoint"];
      } else {
        const parsedPw = parsePasswordCommand(normalized, prefs);
        const parsedQr = !parsedPw ? parseQrCommand(normalized) : null;
        const parsedConv =
          !parsedPw && !parsedQr ? parseConversion(normalized, prefs) : null;

        if (parsedPw) {
          type = "password";
          const pw = randomPassword(parsedPw.length, parsedPw.mode);
          output = {
            password: pw,
            score: strengthScore(pw),
            mode: parsedPw.mode,
            length: parsedPw.length,
          };
          actions = ["copy", "pin"];
        } else if (parsedQr) {
          type = "qr";
          output = { value: parsedQr.value };
          actions = ["copy", "pin"];
        } else if (parsedConv) {
          const conv = parsedConv as {
            type: string;
            value: number;
            from: string;
            to: string;
            note?: string;
          };
          if (conv.type === "currency") {
            type = "currency";
            const converted = convertCurrency(conv.value, conv.from, conv.to);
            output = {
              value: converted,
              formatted: `${CURRENCY_SYMBOLS[conv.to] || conv.to.toUpperCase()} ${formatNumber(converted, 6)}`,
              source: `${conv.value} ${conv.from.toUpperCase()}`,
              note: conv.note,
            };
            actions = ["copy", "pin"];
          } else {
            type = "unit";
            const converted = convertUnits(conv.value, conv.from, conv.to);
            output = {
              value: converted,
              formatted: `${formatNumber(converted, 8)} ${conv.to}`,
              source: `${conv.value} ${conv.from}`,
            };
            actions = ["copy", "pin"];
          }
        } else if (isMathExpression(normalized)) {
          type = "math";
          const value = safeMathEval(normalized);
          output = { value, formatted: formatNumber(value, 10) };
          actions = ["copy", "pin"];
        } else if (parseTimestampCommand(normalized)) {
          const ts = parseTimestampCommand(normalized)!;
          type = "timestamp";
          const fmtOptions: Intl.DateTimeFormatOptions = {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZoneName: "short",
          };
          if (ts.mode === "now") {
            const now = new Date();
            const unix = Math.floor(now.getTime() / 1000);
            output = {
              unix,
              unixMs: now.getTime(),
              utc: now.toUTCString(),
              local: now.toLocaleString(undefined, fmtOptions),
              iso: now.toISOString(),
            };
          } else if (ts.mode === "unix") {
            const n = Number(ts.value);
            const d = new Date(n > 1e10 ? n : n * 1000);
            if (isNaN(d.getTime())) throw new Error("Invalid Unix timestamp");
            output = {
              unix: Math.floor(d.getTime() / 1000),
              unixMs: d.getTime(),
              utc: d.toUTCString(),
              local: d.toLocaleString(undefined, fmtOptions),
              iso: d.toISOString(),
            };
          } else {
            const d = new Date(
              ts.value.includes("T") || ts.value.includes(" ")
                ? ts.value
                : ts.value + "T00:00:00",
            );
            if (isNaN(d.getTime())) throw new Error("Invalid date string");
            output = {
              unix: Math.floor(d.getTime() / 1000),
              unixMs: d.getTime(),
              utc: d.toUTCString(),
              local: d.toLocaleString(undefined, fmtOptions),
              iso: d.toISOString(),
            };
          }
          actions = ["copy", "pin"];
        } else if (parseBase64Command(normalized)) {
          const b64 = parseBase64Command(normalized)!;
          type = "base64";
          if (b64.op === "encode") {
            const encoded = btoa(unescape(encodeURIComponent(b64.text)));
            output = { op: "encode", input: b64.text, result: encoded };
          } else {
            try {
              const decoded = decodeURIComponent(escape(atob(b64.text)));
              output = { op: "decode", input: b64.text, result: decoded };
            } catch {
              throw new Error("Invalid base64 string");
            }
          }
          actions = ["copy", "pin"];
        } else if (normalized.startsWith("pin ")) {
          const target = normalized.slice(4).trim();
          if (!target) throw new Error("Nothing to pin");
          setPinned((prev) =>
            [target, ...prev.filter((x) => x !== target)].slice(0, 12),
          );
          setStatus(`Pinned: ${target}`);
          return;
        } else if (normalized.startsWith("unpin ")) {
          const target = normalized.slice(6).trim();
          setPinned((prev) => prev.filter((x) => x !== target));
          setStatus(`Unpinned: ${target}`);
          return;
        } else {
          throw new Error("Unknown command");
        }
      }

      const record: HistoryRecord = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        input: raw,
        normalized,
        type,
        label: resultLabel(type),
        output,
        actions,
        createdAt: new Date().toISOString(),
      };
      setResult(record);
      addHistory(record);
      setStatus(`Ran ${record.label}`);
      if (options.clearInput !== false) setInput("");
      return record;
    } catch (err) {
      const error = err as Error;
      const record: HistoryRecord = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        input: raw,
        normalized,
        type: "error",
        label: "Error",
        output: { message: error.message || "Command failed" },
        actions: [],
        createdAt: new Date().toISOString(),
      };
      setResult(record);
      addHistory(record);
      setStatus(record.output.message as string);
      return record;
    }
  }

  function runSuggestion(text: string) {
    setInput(text);
    inputRef.current?.focus();
    setIsPaletteOpen(false);
    executeCommand(text);
  }

  async function runSpeedTest() {
    // All three endpoints are from speed.cloudflare.com — CORS-enabled, no auth needed
    const pingUrl = "https://speed.cloudflare.com/__down?bytes=0";
    const downloadUrl = "https://speed.cloudflare.com/__down?bytes=5000000"; // 5 MB
    const uploadUrl = "/api/upload-test";

    setSpeedState({
      running: true,
      dl: null,
      ul: null,
      ping: null,
      message: "Testing ping…",
    });

    let pingMs: string = "—";
    let dlMbps: string = "—";
    let ulMbps: string = "—";

    try {
      // Ping: 5 round trips to a 0-byte endpoint, drop the highest, average the rest
      const pingTimes: number[] = [];
      for (let i = 0; i < 5; i++) {
        const t0 = performance.now();
        await fetch(pingUrl, { cache: "no-store" });
        pingTimes.push(performance.now() - t0);
      }
      pingTimes.sort((a, b) => a - b);
      const avg = pingTimes.slice(0, 4).reduce((s, v) => s + v, 0) / 4;
      pingMs = avg.toFixed(0);
      setSpeedState({
        running: true,
        dl: null,
        ul: null,
        ping: pingMs,
        message: `Ping ${pingMs} ms — testing download…`,
      });
    } catch {
      setSpeedState({
        running: true,
        dl: null,
        ul: null,
        ping: "—",
        message: "Ping failed — testing download…",
      });
    }

    try {
      // Download: stream 5 MB from Cloudflare's speed test endpoint
      const dlStart = performance.now();
      const res = await fetch(downloadUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Streaming not supported");
      let loaded = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        loaded += value.byteLength;
      }
      const dlSec = (performance.now() - dlStart) / 1000;
      dlMbps = ((loaded * 8) / dlSec / 1_000_000).toFixed(2);
      setSpeedState({
        running: true,
        dl: dlMbps,
        ul: null,
        ping: pingMs,
        message: `↓ ${dlMbps} Mbps — testing upload…`,
      });
    } catch {
      setSpeedState({
        running: true,
        dl: "—",
        ul: null,
        ping: pingMs,
        message: "Download failed — testing upload…",
      });
    }

    let ulError = "";
    try {
      // Upload: send JSON payloads (proxy-safe content type) across multiple rounds
      // Each round sends a ~4 KB JSON body; 12 measured rounds = ~48 KB total
      const payload = JSON.stringify({
        d: Array.from({ length: 2000 }, () => Math.random().toString(36)).join(
          "",
        ),
      });
      const byteCount = new TextEncoder().encode(payload).byteLength;

      // Warm-up round (not timed)
      await fetch(uploadUrl, {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
      });

      const ROUNDS = 12;
      let totalBytes = 0;
      const ulStart = performance.now();
      for (let i = 0; i < ROUNDS; i++) {
        const res = await fetch(uploadUrl, {
          method: "POST",
          body: payload,
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await res.json();
        totalBytes += byteCount;
      }
      const ulSec = (performance.now() - ulStart) / 1000;
      ulMbps = ((totalBytes * 8) / ulSec / 1_000_000).toFixed(2);
    } catch (e) {
      ulError = (e as Error).message;
      ulMbps = "—";
    }

    if (ulError) {
      setSpeedState({
        running: false,
        dl: dlMbps,
        ul: "—",
        ping: pingMs,
        message: `Upload failed: ${ulError}`,
      });
    } else {
      setSpeedState({
        running: false,
        dl: dlMbps,
        ul: ulMbps,
        ping: pingMs,
        message: "Test complete",
      });
    }

    const record: HistoryRecord = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      input: "speed test",
      normalized: "speed test",
      type: "speed",
      label: "Speed test",
      output: {
        downloadMbps: dlMbps,
        uploadMbps: ulMbps,
        pingMs,
        note: "Browser-based estimate via Cloudflare speed test endpoints.",
      },
      actions: ["copy", "pin"],
      createdAt: new Date().toISOString(),
    };
    setResult(record);
    addHistory(record);
    setStatus(`↓ ${dlMbps} Mbps  ↑ ${ulMbps} Mbps  ping ${pingMs} ms`);
  }

  async function runDnsLookup(domain: string, raw: string) {
    setStatus(`Looking up ${domain}…`);
    const t0 = performance.now();
    try {
      const [resA, resAAAA] = await Promise.all([
        fetch(
          `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`,
          {
            headers: { Accept: "application/dns-json" },
          },
        ),
        fetch(
          `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=AAAA`,
          {
            headers: { Accept: "application/dns-json" },
          },
        ),
      ]);
      const responseMs = Math.round(performance.now() - t0);
      const [dataA, dataAAAA] = await Promise.all([
        resA.json() as Promise<DnsResponse>,
        resAAAA.json() as Promise<DnsResponse>,
      ]);
      const ipv4 = (dataA.Answer ?? [])
        .filter((r) => r.type === 1)
        .map((r) => r.data);
      const ipv6 = (dataAAAA.Answer ?? [])
        .filter((r) => r.type === 28)
        .map((r) => r.data);
      const ttl = dataA.Answer?.[0]?.TTL ?? null;
      const status =
        dataA.Status === 0 ? "resolved" : `NXDOMAIN (${dataA.Status})`;
      const record: HistoryRecord = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        input: raw,
        normalized: normalize(raw),
        type: "dns",
        label: "DNS lookup",
        output: { domain, ipv4, ipv6, ttl, responseMs, status },
        actions: ["copy", "pin"],
        createdAt: new Date().toISOString(),
      };
      setResult(record);
      addHistory(record);
      setStatus(
        `${domain} → ${ipv4[0] ?? ipv6[0] ?? "NXDOMAIN"} (${responseMs} ms)`,
      );
      setInput("");
    } catch (err) {
      const msg = (err as Error).message;
      setStatus(`DNS lookup failed: ${msg}`);
    }
  }

  async function runHash(text: string, raw: string) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const [buf1, buf256, buf512] = await Promise.all([
        crypto.subtle.digest("SHA-1", data),
        crypto.subtle.digest("SHA-256", data),
        crypto.subtle.digest("SHA-512", data),
      ]);
      const toHex = (buf: ArrayBuffer) =>
        Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      const record: HistoryRecord = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        input: raw,
        normalized: normalize(raw),
        type: "hash",
        label: "Hash",
        output: {
          text,
          sha1: toHex(buf1),
          sha256: toHex(buf256),
          sha512: toHex(buf512),
        },
        actions: ["pin"],
        createdAt: new Date().toISOString(),
      };
      setResult(record);
      addHistory(record);
      setStatus("Hashes computed");
      setInput("");
    } catch (err) {
      setStatus(`Hash failed: ${(err as Error).message}`);
    }
  }

  const suggestions = useMemo(() => commandSuggestions(input), [input]);

  useEffect(() => {
    setSelectedSuggestion(0);
  }, [input]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (document.activeElement === inputRef.current) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedSuggestion((prev) =>
            Math.min(prev + 1, Math.max(suggestions.length - 1, 0)),
          );
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedSuggestion((prev) => Math.max(prev - 1, 0));
        }
        if (e.key === "Tab") {
          e.preventDefault();
          if (suggestions[selectedSuggestion])
            setInput(suggestions[selectedSuggestion]);
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setIsPaletteOpen(false);
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          const finalCommand = input || suggestions[selectedSuggestion];
          const n = normalize(finalCommand);
          const dnsDomain = parseDnsCommand(n);
          const hashText = parseHashCommand(n);
          if (n === "speed test" || n === "speed") runSpeedTest();
          else if (dnsDomain) runDnsLookup(dnsDomain, finalCommand);
          else if (hashText) runHash(hashText, finalCommand);
          else executeCommand(finalCommand);
          setIsPaletteOpen(false);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [input, suggestions, selectedSuggestion]);

  return (
    <div className="text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        {/* Sticky header */}
        <header className="sticky top-4 z-20 mb-6 rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold tracking-tight shrink-0">
              Command Console
            </h1>
            <div className="relative flex-1">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setIsPaletteOpen(true);
                }}
                onFocus={() => setIsPaletteOpen(true)}
                onBlur={() => setTimeout(() => setIsPaletteOpen(false), 120)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setIsPaletteOpen(false);
                    return;
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const n = normalize(input);
                    const dnsDomain = parseDnsCommand(n);
                    const hashText = parseHashCommand(n);
                    if (n === "speed test" || n === "speed") runSpeedTest();
                    else if (dnsDomain) runDnsLookup(dnsDomain, input);
                    else if (hashText) runHash(hashText, input);
                    else executeCommand(input);
                    setIsPaletteOpen(false);
                  }
                }}
                placeholder="100 usd to myr · password 20 · qr https://... · 16*24+10 · hash ..."
                className="w-full rounded-xl border border-slate-700 bg-black/70 px-4 py-2.5 pr-10 text-sm outline-none transition placeholder:text-slate-500 focus:border-slate-400 focus:bg-slate-900"
              />
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">
                <span>↵</span>
              </div>

              {isPaletteOpen && suggestions.length > 0 && (
                <div className="absolute left-0 top-[calc(100%+12px)] z-30 w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
                  <div className="border-b border-slate-800 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                    Command palette
                  </div>
                  <div className="max-h-80 overflow-auto p-2">
                    {suggestions.map((s, idx) => (
                      <button
                        key={s}
                        onClick={() => runSuggestion(s)}
                        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition ${idx === selectedSuggestion ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800/50"}`}
                      >
                        <div className="flex flex-col">
                          <span className="font-mono text-sm">{s}</span>
                          <span className="mt-1 text-xs text-slate-500">
                            {suggestionDescription(s)}
                          </span>
                        </div>
                        <div className="rounded-lg border border-slate-700 px-2 py-1 text-[10px] text-slate-500">
                          ↵
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                const n = normalize(input);
                const dnsDomain = parseDnsCommand(n);
                const hashText = parseHashCommand(n);
                if (n === "speed test" || n === "speed") runSpeedTest();
                else if (dnsDomain) runDnsLookup(dnsDomain, input);
                else if (hashText) runHash(hashText, input);
                else executeCommand(input);
              }}
              className="shrink-0 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-white"
            >
              Run
            </button>
            <button
              onClick={() => setInput("")}
              className="shrink-0 rounded-xl border border-slate-700 px-3 py-2.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              ✕
            </button>
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="space-y-6">
            {/* Result panel */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Result</h2>
                  <p className="text-sm text-slate-400">{status}</p>
                </div>
                {result && (
                  <button
                    onClick={() =>
                      copyText(
                        typeof result.output === "string"
                          ? result.output
                          : JSON.stringify(result.output, null, 2),
                      )
                    }
                    className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                  >
                    Copy output
                  </button>
                )}
              </div>

              {!result && (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-sm text-slate-400">
                  Execute a command to see a structured result here.
                </div>
              )}

              {result && (
                <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {result.label}
                      </div>
                      <div className="mt-1 text-xl font-semibold text-slate-100">
                        {result.input}
                      </div>
                    </div>
                    <div className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                      {result.type}
                    </div>
                  </div>

                  {result.type === "error" && (
                    <div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
                      {result.output.message as string}
                    </div>
                  )}

                  {result.type === "math" && (
                    <div>
                      <div className="text-sm text-slate-400">Answer</div>
                      <div className="mt-1 text-3xl font-semibold">
                        {result.output.formatted as string}
                      </div>
                    </div>
                  )}

                  {(result.type === "unit" || result.type === "currency") && (
                    <div>
                      <div className="text-sm text-slate-400">Converted</div>
                      <div className="mt-1 text-3xl font-semibold">
                        {result.output.formatted as string}
                      </div>
                      <div className="mt-2 text-sm text-slate-400">
                        From {result.output.source as string}
                      </div>
                      {!!result.output.note && (
                        <div className="mt-1 text-xs text-slate-500">
                          {result.output.note as string}
                        </div>
                      )}
                    </div>
                  )}

                  {result.type === "password" && (
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-slate-400">Password</div>
                        <div className="mt-1 break-all rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 font-mono text-base">
                          {result.output.password as string}
                        </div>
                      </div>
                      <div className="text-sm text-slate-400">
                        Strength score: {result.output.score as number}/6 ·
                        Mode: {result.output.mode as string} · Length:{" "}
                        {result.output.length as number}
                      </div>
                    </div>
                  )}

                  {result.type === "qr" && (
                    <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
                      <div className="rounded-2xl border border-slate-800 bg-white p-3 inline-block">
                        <QRCodeSVG
                          value={result.output.value as string}
                          size={176}
                        />
                      </div>
                      <div>
                        <div className="text-sm text-slate-400">
                          Encoded value
                        </div>
                        <div className="mt-1 break-all rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm">
                          {result.output.value as string}
                        </div>
                      </div>
                    </div>
                  )}

                  {result.type === "speed" && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4">
                        <div className="text-sm text-slate-400">
                          Speed test status
                        </div>
                        <div className="mt-1 text-lg text-slate-100">
                          {speedState?.message ?? "Run the test to see results"}
                        </div>
                        {speedState?.running && (
                          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-800">
                            <div className="h-full w-1/3 animate-pulse rounded-full bg-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        {(() => {
                          const dlVal =
                            speedState?.dl ??
                            (result.output.downloadMbps as
                              | string
                              | undefined) ??
                            null;
                          const ulVal =
                            speedState?.ul ??
                            (result.output.uploadMbps as string | undefined) ??
                            null;
                          const pingVal =
                            speedState?.ping ??
                            (result.output.pingMs as string | undefined) ??
                            null;
                          const dlQ =
                            dlVal && dlVal !== "—"
                              ? downloadQuality(dlVal)
                              : null;
                          const ulQ =
                            ulVal && ulVal !== "—"
                              ? uploadQuality(ulVal)
                              : null;
                          const pingQ =
                            pingVal && pingVal !== "—"
                              ? pingQuality(pingVal)
                              : null;
                          return (
                            <>
                              <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4">
                                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                                  Download
                                </div>
                                <div className="mt-1 text-2xl font-semibold">
                                  {dlVal && dlVal !== "—"
                                    ? `${dlVal} Mbps`
                                    : "—"}
                                </div>
                                {dlQ && (
                                  <div
                                    className={`mt-1 text-xs font-medium ${dlQ.color}`}
                                  >
                                    {dlQ.label}
                                  </div>
                                )}
                              </div>
                              <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4">
                                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                                  Upload
                                </div>
                                <div className="mt-1 text-2xl font-semibold">
                                  {ulVal && ulVal !== "—"
                                    ? `${ulVal} Mbps`
                                    : "—"}
                                </div>
                                {ulQ && (
                                  <div
                                    className={`mt-1 text-xs font-medium ${ulQ.color}`}
                                  >
                                    {ulQ.label}
                                  </div>
                                )}
                              </div>
                              <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4">
                                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                                  Ping
                                </div>
                                <div className="mt-1 text-2xl font-semibold">
                                  {pingVal && pingVal !== "—"
                                    ? `${pingVal} ms`
                                    : "—"}
                                </div>
                                {pingQ && (
                                  <div
                                    className={`mt-1 text-xs font-medium ${pingQ.color}`}
                                  >
                                    {pingQ.label}
                                  </div>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      <button
                        onClick={runSpeedTest}
                        disabled={speedState?.running}
                        className="rounded-2xl bg-slate-100 px-4 py-3 font-medium text-slate-950 transition hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {speedState?.running ? "Running…" : "Run speed test"}
                      </button>
                    </div>
                  )}

                  {result.type === "timestamp" && (
                    <div className="space-y-2">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            Unix (seconds)
                          </div>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <span className="font-mono text-lg text-slate-100">
                              {result.output.unix as number}
                            </span>
                            <button
                              onClick={() => {
                                copyText(String(result.output.unix));
                                setStatus("Copied");
                              }}
                              className="rounded-lg px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-700 hover:text-white transition"
                            >
                              copy
                            </button>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            Unix (ms)
                          </div>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <span className="font-mono text-lg text-slate-100">
                              {result.output.unixMs as number}
                            </span>
                            <button
                              onClick={() => {
                                copyText(String(result.output.unixMs));
                                setStatus("Copied");
                              }}
                              className="rounded-lg px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-700 hover:text-white transition"
                            >
                              copy
                            </button>
                          </div>
                        </div>
                      </div>
                      {[
                        { label: "ISO 8601", key: "iso" },
                        { label: "UTC", key: "utc" },
                        { label: "Local", key: "local" },
                      ].map(({ label, key }) => (
                        <div
                          key={key}
                          className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                              {label}
                            </span>
                            <button
                              onClick={() => {
                                copyText(result.output[key] as string);
                                setStatus("Copied");
                              }}
                              className="rounded-lg px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-700 hover:text-white transition"
                            >
                              copy
                            </button>
                          </div>
                          <div className="mt-1 font-mono text-sm text-slate-100">
                            {result.output[key] as string}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.type === "hash" && (
                    <div className="space-y-2">
                      {(["sha1", "sha256", "sha512"] as const).map((algo) => (
                        <div
                          key={algo}
                          className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                              {algo === "sha1"
                                ? "SHA-1"
                                : algo === "sha256"
                                  ? "SHA-256"
                                  : "SHA-512"}
                            </div>
                            <button
                              onClick={() => {
                                copyText(result.output[algo] as string);
                                setStatus("Copied");
                              }}
                              className="rounded-lg px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-700 hover:text-white transition"
                            >
                              copy
                            </button>
                          </div>
                          <div className="mt-1 break-all font-mono text-xs text-slate-100">
                            {result.output[algo] as string}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.type === "base64" && (
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          {result.output.op === "encode"
                            ? "Encoded"
                            : "Decoded"}
                        </div>
                        <div className="mt-2 break-all font-mono text-sm text-slate-100">
                          {result.output.result as string}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                        <span className="text-xs text-slate-500">Input </span>
                        <span className="break-all font-mono text-sm text-slate-400">
                          {result.output.input as string}
                        </span>
                      </div>
                    </div>
                  )}

                  {result.type === "dns" && (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            IPv4 (A records)
                          </div>
                          {(result.output.ipv4 as string[]).length === 0 ? (
                            <div className="mt-2 text-sm text-slate-400">
                              No A records
                            </div>
                          ) : (
                            (result.output.ipv4 as string[]).map((ip) => (
                              <div
                                key={ip}
                                className="mt-2 font-mono text-sm text-slate-100"
                              >
                                {ip}
                              </div>
                            ))
                          )}
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            IPv6 (AAAA records)
                          </div>
                          {(result.output.ipv6 as string[]).length === 0 ? (
                            <div className="mt-2 text-sm text-slate-400">
                              No AAAA records
                            </div>
                          ) : (
                            (result.output.ipv6 as string[]).map((ip) => (
                              <div
                                key={ip}
                                className="mt-2 break-all font-mono text-sm text-slate-100"
                              >
                                {ip}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                          <span className="text-xs text-slate-500">
                            Response time{" "}
                          </span>
                          <span className="font-mono text-sm text-slate-100">
                            {result.output.responseMs as number} ms
                          </span>
                        </div>
                        {result.output.ttl !== null && (
                          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                            <span className="text-xs text-slate-500">TTL </span>
                            <span className="font-mono text-sm text-slate-100">
                              {result.output.ttl as number} s
                            </span>
                          </div>
                        )}
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                          <span className="text-xs text-slate-500">
                            Status{" "}
                          </span>
                          <span
                            className={`font-mono text-sm ${result.output.status === "resolved" ? "text-green-400" : "text-red-400"}`}
                          >
                            {result.output.status as string}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    {result.actions.map((a) => (
                      <button
                        key={a}
                        onClick={() => {
                          if (a === "copy") {
                            const copyValue =
                              result.type === "password"
                                ? (result.output.password as string)
                                : result.type === "qr"
                                  ? (result.output.value as string)
                                  : result.type === "dns"
                                    ? (result.output.ipv4 as string[])
                                        .concat(result.output.ipv6 as string[])
                                        .join("\n")
                                    : result.type === "base64"
                                      ? (result.output.result as string)
                                      : (result.output.formatted as string) ||
                                        JSON.stringify(result.output, null, 2);
                            copyText(copyValue);
                            setStatus("Copied to clipboard");
                          }
                          if (a === "pin") {
                            setPinned((prev) =>
                              [
                                result.input,
                                ...prev.filter((x) => x !== result.input),
                              ].slice(0, 12),
                            );
                            setStatus("Pinned command");
                          }
                        }}
                        className="rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pinned + Settings */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Pinned shortcuts</h3>
                  <span className="text-xs text-slate-500">
                    {pinned.length}/12
                  </span>
                </div>
                {pinned.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-4 text-sm text-slate-400">
                    Pin commands from results or use{" "}
                    <span className="font-mono text-slate-300">
                      pin [command]
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pinned.map((item) => (
                      <div
                        key={item}
                        className="flex items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3"
                      >
                        <button
                          className="text-left text-sm text-slate-200 hover:text-white"
                          onClick={() => runSuggestion(item)}
                        >
                          {item}
                        </button>
                        <button
                          onClick={() =>
                            setPinned((prev) => prev.filter((x) => x !== item))
                          }
                          className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-400 hover:bg-slate-800"
                        >
                          remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Settings</h3>
                  <span className="text-xs text-slate-500">Stored locally</span>
                </div>
                <div className="grid gap-3">
                  <label className="grid gap-1 text-sm text-slate-300">
                    Default password length
                    <input
                      type="number"
                      value={prefs.passwordLength}
                      onChange={(e) =>
                        setPrefs((p) => ({
                          ...p,
                          passwordLength: Number(e.target.value || 16),
                        }))
                      }
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-slate-500"
                    />
                  </label>
                  <label className="grid gap-1 text-sm text-slate-300">
                    Default password mode
                    <select
                      value={prefs.passwordMode}
                      onChange={(e) =>
                        setPrefs((p) => ({
                          ...p,
                          passwordMode: e.target.value,
                        }))
                      }
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-slate-500"
                    >
                      <option value="weak">weak</option>
                      <option value="medium">medium</option>
                      <option value="strong">strong</option>
                    </select>
                  </label>
                  <div className="text-sm text-slate-400">
                    Tip: use{" "}
                    <span className="font-mono text-slate-200">
                      gen password
                    </span>
                    , <span className="font-mono text-slate-200">qr ...</span>,{" "}
                    <span className="font-mono text-slate-200">
                      100 usd to myr
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            {/* Examples */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10">
              <h3 className="text-lg font-semibold">Examples</h3>
              <div className="mt-4 space-y-2">
                {COMMAND_EXAMPLES.map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => runSuggestion(cmd)}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-800"
                  >
                    <span className="font-mono">{cmd}</span>
                    <span className="text-xs text-slate-500">run</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent history */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent history</h3>
                <button
                  onClick={() => setHistory([])}
                  className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400 hover:bg-slate-800"
                >
                  clear
                </button>
              </div>
              {history.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-4 text-sm text-slate-400">
                  No commands yet.
                </div>
              ) : (
                <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setResult(item)}
                      className="block w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-left hover:bg-slate-800"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium text-slate-200">
                          {item.input}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.type}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10">
              <h3 className="text-lg font-semibold">Notes</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-400">
                <li>
                  QR generation uses the built-in qrcode.react library — works
                  offline.
                </li>
                <li>
                  Currency conversion is manual/static here. Replace it with a
                  real rate source if you need live FX.
                </li>
                <li>
                  Speed test downloads a public library file via CDN. For
                  production, use your own test file or backend endpoint.
                </li>
              </ul>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
