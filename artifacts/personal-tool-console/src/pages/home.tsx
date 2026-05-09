import React, { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const STORAGE_KEYS = {
  history: 'ptc_history_v1',
  pins: 'ptc_pins_v1',
  prefs: 'ptc_prefs_v1',
};

const DEFAULT_PREFS = {
  passwordLength: 16,
  passwordMode: 'strong',
  defaultCurrencyFrom: 'usd',
  defaultCurrencyTo: 'myr',
};

const UNIT_TABLE: Record<string, Record<string, number>> = {
  length: {
    mm: 0.001, cm: 0.01, m: 1, km: 1000,
    in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344,
  },
  mass: {
    mg: 0.000001, g: 0.001, kg: 1,
    oz: 0.028349523125, lb: 0.45359237,
  },
  speed: {
    'm/s': 1, 'km/h': 1000 / 3600,
    mph: 1609.344 / 3600, knot: 1852 / 3600,
  },
  area: {
    'm2': 1, 'cm2': 0.0001, 'km2': 1_000_000,
    acre: 4046.8564224, ha: 10_000,
  },
  volume: {
    ml: 0.000001, l: 0.001, m3: 1,
    tsp: 0.00000492892159375, tbsp: 0.00001478676478125,
    cup: 0.0002365882365, fl_oz: 0.0000295735295625, gal: 0.003785411784,
  },
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  usd: '$', myr: 'RM', eur: '€', gbp: '£',
  jpy: '¥', sgd: 'S$', aud: 'A$', idr: 'Rp',
};

const COMMAND_EXAMPLES = [
  '100 usd to myr',
  '10 km to mi',
  '16 * 24 + 10',
  'gen password 16 strong',
  'qr https://example.com',
  'speed test',
];

function suggestionDescription(s: string) {
  if (s.includes(' to ')) return s.includes('usd') || s.includes('myr') || s.includes('eur') ? 'Currency conversion' : 'Unit conversion';
  if (s.includes('password')) return 'Password generation';
  if (s.startsWith('qr')) return 'QR generation';
  if (s.includes('speed')) return 'Network test';
  return 'Math expression';
}

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function formatNumber(value: number, digits = 8) {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e9 || abs < 1e-6)) return value.toExponential(6).replace(/\+/, '');
  return Number.parseFloat(value.toFixed(digits)).toString();
}

function normalize(input: string) {
  return input.trim().replace(/\s+/g, ' ').toLowerCase();
}

function isMathExpression(input: string) {
  return /^[0-9+\-*/%^().,\s]+$/.test(input) && /\d/.test(input);
}

function safeMathEval(expression: string) {
  const cleaned = expression.replace(/,/g, '.').replace(/\^/g, '**');
  if (!/^[0-9+\-*/%().*\s**]+$/.test(cleaned.replace(/\*\*/g, ''))) throw new Error('Invalid expression');
  // eslint-disable-next-line no-new-func
  const result = Function(`"use strict"; return (${cleaned});`)();
  if (typeof result !== 'number' || !Number.isFinite(result)) throw new Error('Invalid result');
  return result as number;
}

function parsePasswordCommand(input: string, prefs: typeof DEFAULT_PREFS) {
  const m = input.match(/^(?:gen\s+)?password(?:\s+(\d{1,3}))?(?:\s+(weak|medium|strong))?$/i);
  if (!m) return null;
  return {
    type: 'password',
    length: Math.max(4, Math.min(128, Number(m[1] || prefs.passwordLength || 16))),
    mode: (m[2] || prefs.passwordMode || 'strong').toLowerCase(),
  };
}

function parseQrCommand(input: string) {
  if (!input.startsWith('qr ')) return null;
  const value = input.slice(3).trim();
  if (!value) return null;
  return { type: 'qr', value };
}

function parseConversion(input: string, prefs: typeof DEFAULT_PREFS) {
  const currencyPattern = /^(?:(\d+(?:\.\d+)?)\s+)?([a-z]{3})\s+to\s+([a-z]{3})$/i;
  const unitPattern = /^(\d+(?:\.\d+)?)\s+([a-z\/0-9_]+)\s+to\s+([a-z\/0-9_]+)$/i;
  const cm = input.match(currencyPattern);
  if (cm) {
    return {
      type: 'currency',
      value: cm[1] ? Number(cm[1]) : 1,
      from: cm[2].toLowerCase(),
      to: cm[3].toLowerCase(),
      note: 'Rates are local/manual in this prototype.',
      prefs,
    };
  }
  const um = input.match(unitPattern);
  if (!um) return null;
  return { type: 'unit', value: Number(um[1]), from: um[2].toLowerCase(), to: um[3].toLowerCase() };
}

function findUnitCategory(unit: string) {
  for (const [category, map] of Object.entries(UNIT_TABLE)) {
    if (Object.prototype.hasOwnProperty.call(map, unit)) return category;
  }
  return null;
}

function convertUnits(value: number, from: string, to: string) {
  const category = findUnitCategory(from);
  if (!category || findUnitCategory(to) !== category) throw new Error('Unsupported unit pair');
  const base = value * UNIT_TABLE[category][from];
  return base / UNIT_TABLE[category][to];
}

function convertCurrency(value: number, from: string, to: string) {
  const rates: Record<string, number> = {
    usd: 1, myr: 4.7, eur: 0.92, gbp: 0.78,
    jpy: 154, sgd: 1.35, aud: 1.51, idr: 15850,
  };
  if (!rates[from] || !rates[to]) throw new Error('Unsupported currency');
  return (value / rates[from]) * rates[to];
}

function randomPassword(length: number, mode: string) {
  const sets: Record<string, string> = {
    weak: 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789',
    medium: 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%?_-',
    strong: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{};:,.<>/?',
  };
  const chars = sets[mode] || sets.strong;
  const bytes = new Uint32Array(length);
  window.crypto.getRandomValues(bytes);
  let out = '';
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
    case 'math': return 'Calculator';
    case 'unit': return 'Unit converter';
    case 'currency': return 'Currency converter';
    case 'password': return 'Password generator';
    case 'qr': return 'QR generator';
    case 'speed': return 'Speed test';
    default: return 'Command';
  }
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

export default function Home() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [input, setInput] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [result, setResult] = useState<HistoryRecord | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);
  const [status, setStatus] = useState('Ready');
  const [speedState, setSpeedState] = useState<SpeedState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedPrefs = loadJson(STORAGE_KEYS.prefs, DEFAULT_PREFS);
    const storedHistory = loadJson(STORAGE_KEYS.history, []);
    const storedPins = loadJson(STORAGE_KEYS.pins, []);
    setPrefs({ ...DEFAULT_PREFS, ...storedPrefs });
    setHistory(Array.isArray(storedHistory) ? storedHistory : []);
    setPinned(Array.isArray(storedPins) ? storedPins : []);
  }, []);

  useEffect(() => saveJson(STORAGE_KEYS.prefs, prefs), [prefs]);
  useEffect(() => saveJson(STORAGE_KEYS.history, history.slice(0, 80)), [history]);
  useEffect(() => saveJson(STORAGE_KEYS.pins, pinned), [pinned]);

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
    let type = 'unknown';
    let actions: string[] = [];

    try {
      if (normalized === 'speed test' || normalized === 'speed') {
        type = 'speed';
        output = {
          title: 'Speed test is scaffolded',
          details: 'This prototype includes the UI and history, but a true browser speed test needs a test file or backend endpoint you control.',
        };
        setSpeedState({ running: false, dl: null, ul: null, ping: null });
        actions = ['configure speed endpoint'];
      } else {
        const parsedPw = parsePasswordCommand(normalized, prefs);
        const parsedQr = !parsedPw ? parseQrCommand(normalized) : null;
        const parsedConv = !parsedPw && !parsedQr ? parseConversion(normalized, prefs) : null;

        if (parsedPw) {
          type = 'password';
          const pw = randomPassword(parsedPw.length, parsedPw.mode);
          output = { password: pw, score: strengthScore(pw), mode: parsedPw.mode, length: parsedPw.length };
          actions = ['copy', 'pin'];
        } else if (parsedQr) {
          type = 'qr';
          output = { value: parsedQr.value };
          actions = ['copy', 'pin'];
        } else if (parsedConv) {
          const conv = parsedConv as { type: string; value: number; from: string; to: string; note?: string };
          if (conv.type === 'currency') {
            type = 'currency';
            const converted = convertCurrency(conv.value, conv.from, conv.to);
            output = {
              value: converted,
              formatted: `${CURRENCY_SYMBOLS[conv.to] || conv.to.toUpperCase()} ${formatNumber(converted, 6)}`,
              source: `${conv.value} ${conv.from.toUpperCase()}`,
              note: conv.note,
            };
            actions = ['copy', 'pin'];
          } else {
            type = 'unit';
            const converted = convertUnits(conv.value, conv.from, conv.to);
            output = {
              value: converted,
              formatted: `${formatNumber(converted, 8)} ${conv.to}`,
              source: `${conv.value} ${conv.from}`,
            };
            actions = ['copy', 'pin'];
          }
        } else if (isMathExpression(normalized)) {
          type = 'math';
          const value = safeMathEval(normalized);
          output = { value, formatted: formatNumber(value, 10) };
          actions = ['copy', 'pin'];
        } else if (normalized.startsWith('pin ')) {
          const target = normalized.slice(4).trim();
          if (!target) throw new Error('Nothing to pin');
          setPinned((prev) => [target, ...prev.filter((x) => x !== target)].slice(0, 12));
          setStatus(`Pinned: ${target}`);
          return;
        } else if (normalized.startsWith('unpin ')) {
          const target = normalized.slice(6).trim();
          setPinned((prev) => prev.filter((x) => x !== target));
          setStatus(`Unpinned: ${target}`);
          return;
        } else {
          throw new Error('Unknown command');
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
      if (options.clearInput !== false) setInput('');
      return record;
    } catch (err) {
      const error = err as Error;
      const record: HistoryRecord = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        input: raw,
        normalized,
        type: 'error',
        label: 'Error',
        output: { message: error.message || 'Command failed' },
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
    const pingUrl = 'https://cloudflare.com/cdn-cgi/trace';
    const downloadUrl = 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js';
    const uploadUrl = 'https://httpbin.org/post';

    setSpeedState({ running: true, dl: null, ul: null, ping: null, message: 'Testing ping…' });

    let pingMs: string = '—';
    let dlMbps: string = '—';
    let ulMbps: string = '—';

    try {
      // Ping: 5 round trips, drop highest, average the rest
      const pingTimes: number[] = [];
      for (let i = 0; i < 5; i++) {
        const t0 = performance.now();
        await fetch(pingUrl, { cache: 'no-store', mode: 'no-cors' });
        pingTimes.push(performance.now() - t0);
      }
      pingTimes.sort((a, b) => a - b);
      const avg = pingTimes.slice(0, 4).reduce((s, v) => s + v, 0) / 4;
      pingMs = avg.toFixed(0);
      setSpeedState({ running: true, dl: null, ul: null, ping: pingMs, message: `Ping ${pingMs} ms — testing download…` });
    } catch {
      setSpeedState({ running: true, dl: null, ul: null, ping: '—', message: 'Ping failed — testing download…' });
    }

    try {
      // Download
      const dlStart = performance.now();
      const res = await fetch(downloadUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error('Streaming not supported');
      let loaded = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        loaded += value.byteLength;
      }
      const dlSec = (performance.now() - dlStart) / 1000;
      dlMbps = ((loaded * 8) / dlSec / 1_000_000).toFixed(2);
      setSpeedState({ running: true, dl: dlMbps, ul: null, ping: pingMs, message: `↓ ${dlMbps} Mbps — testing upload…` });
    } catch {
      setSpeedState({ running: true, dl: '—', ul: null, ping: pingMs, message: 'Download failed — testing upload…' });
    }

    try {
      // Upload: POST 1 MB of random data
      const bytes = new Uint8Array(1_000_000);
      crypto.getRandomValues(bytes);
      const blob = new Blob([bytes]);
      const ulStart = performance.now();
      await fetch(uploadUrl, { method: 'POST', body: blob, headers: { 'Content-Type': 'application/octet-stream' } });
      const ulSec = (performance.now() - ulStart) / 1000;
      ulMbps = ((blob.size * 8) / ulSec / 1_000_000).toFixed(2);
    } catch {
      ulMbps = '—';
    }

    setSpeedState({ running: false, dl: dlMbps, ul: ulMbps, ping: pingMs, message: 'Test complete' });

    const record: HistoryRecord = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      input: 'speed test',
      normalized: 'speed test',
      type: 'speed',
      label: 'Speed test',
      output: { downloadMbps: dlMbps, uploadMbps: ulMbps, pingMs, note: 'Browser-based estimate using CDN test files.' },
      actions: ['copy', 'pin'],
      createdAt: new Date().toISOString(),
    };
    setResult(record);
    addHistory(record);
    setStatus(`↓ ${dlMbps} Mbps  ↑ ${ulMbps} Mbps  ping ${pingMs} ms`);
  }

  const suggestions = useMemo(() => commandSuggestions(input), [input]);

  useEffect(() => { setSelectedSuggestion(0); }, [input]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (document.activeElement === inputRef.current) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedSuggestion((prev) => Math.min(prev + 1, Math.max(suggestions.length - 1, 0)));
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedSuggestion((prev) => Math.max(prev - 1, 0));
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          if (suggestions[selectedSuggestion]) setInput(suggestions[selectedSuggestion]);
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsPaletteOpen(false);
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          const finalCommand = input || suggestions[selectedSuggestion];
          if (normalize(finalCommand) === 'speed test' || normalize(finalCommand) === 'speed') runSpeedTest();
          else executeCommand(finalCommand);
          setIsPaletteOpen(false);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [input, suggestions, selectedSuggestion]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">

        {/* Sticky header */}
        <header className="sticky top-4 z-20 mb-6 flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Personal Tool Console</h1>
              <p className="mt-1 text-sm text-slate-400">Command-driven utilities with local history, saved shortcuts, and fast results.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="rounded-full border border-slate-700 px-3 py-1">Press / to focus</span>
              <span className="rounded-full border border-slate-700 px-3 py-1">Enter to run</span>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="relative">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); setIsPaletteOpen(true); }}
                onFocus={() => setIsPaletteOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { e.preventDefault(); setIsPaletteOpen(false); return; }
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (normalize(input) === 'speed test' || normalize(input) === 'speed') runSpeedTest();
                    else executeCommand(input);
                    setIsPaletteOpen(false);
                  }
                }}
                placeholder="Search or run a command… 100 usd to myr, password 20, qr https://..., 16*24+10"
                className="w-full rounded-2xl border border-slate-700 bg-black/70 px-5 py-5 pr-28 text-lg outline-none transition placeholder:text-slate-500 focus:border-slate-400 focus:bg-slate-900"
              />
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center gap-2 text-xs text-slate-400">
                <span>⌘↵</span>
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
                        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition ${idx === selectedSuggestion ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/50'}`}
                      >
                        <div className="flex flex-col">
                          <span className="font-mono text-sm">{s}</span>
                          <span className="mt-1 text-xs text-slate-500">{suggestionDescription(s)}</span>
                        </div>
                        <div className="rounded-lg border border-slate-700 px-2 py-1 text-[10px] text-slate-500">↵</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => (normalize(input) === 'speed test' || normalize(input) === 'speed' ? runSpeedTest() : executeCommand(input))}
                className="rounded-2xl bg-slate-100 px-4 py-3 font-medium text-slate-950 transition hover:bg-white"
              >
                Execute
              </button>
              <button
                onClick={() => setInput('')}
                className="rounded-2xl border border-slate-700 px-4 py-3 font-medium text-slate-200 transition hover:bg-slate-800"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-500">
            <span className="rounded-full border border-slate-800 px-3 py-1">↑↓ navigate</span>
            <span className="rounded-full border border-slate-800 px-3 py-1">Tab autocomplete</span>
            <span className="rounded-full border border-slate-800 px-3 py-1">Enter execute</span>
            <span className="rounded-full border border-slate-800 px-3 py-1">/ focus</span>
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
                    onClick={() => copyText(typeof result.output === 'string' ? result.output : JSON.stringify(result.output, null, 2))}
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
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{result.label}</div>
                      <div className="mt-1 text-xl font-semibold text-slate-100">{result.input}</div>
                    </div>
                    <div className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{result.type}</div>
                  </div>

                  {result.type === 'error' && (
                    <div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
                      {result.output.message as string}
                    </div>
                  )}

                  {result.type === 'math' && (
                    <div>
                      <div className="text-sm text-slate-400">Answer</div>
                      <div className="mt-1 text-3xl font-semibold">{result.output.formatted as string}</div>
                    </div>
                  )}

                  {(result.type === 'unit' || result.type === 'currency') && (
                    <div>
                      <div className="text-sm text-slate-400">Converted</div>
                      <div className="mt-1 text-3xl font-semibold">{result.output.formatted as string}</div>
                      <div className="mt-2 text-sm text-slate-400">From {result.output.source as string}</div>
                      {result.output.note && <div className="mt-1 text-xs text-slate-500">{result.output.note as string}</div>}
                    </div>
                  )}

                  {result.type === 'password' && (
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-slate-400">Password</div>
                        <div className="mt-1 break-all rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 font-mono text-base">{result.output.password as string}</div>
                      </div>
                      <div className="text-sm text-slate-400">
                        Strength score: {result.output.score as number}/6 · Mode: {result.output.mode as string} · Length: {result.output.length as number}
                      </div>
                    </div>
                  )}

                  {result.type === 'qr' && (
                    <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
                      <div className="rounded-2xl border border-slate-800 bg-white p-3 inline-block">
                        <QRCodeSVG value={result.output.value as string} size={176} />
                      </div>
                      <div>
                        <div className="text-sm text-slate-400">Encoded value</div>
                        <div className="mt-1 break-all rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm">{result.output.value as string}</div>
                      </div>
                    </div>
                  )}

                  {result.type === 'speed' && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4">
                        <div className="text-sm text-slate-400">Speed test status</div>
                        <div className="mt-1 text-lg text-slate-100">
                          {speedState?.message ?? 'Run the test to see results'}
                        </div>
                        {speedState?.running && (
                          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-800">
                            <div className="h-full w-1/3 animate-pulse rounded-full bg-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Download</div>
                          <div className="mt-1 text-2xl font-semibold">
                            {speedState?.dl != null ? `${speedState.dl} Mbps` : (result.output.downloadMbps ? `${result.output.downloadMbps} Mbps` : '—')}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Upload</div>
                          <div className="mt-1 text-2xl font-semibold">
                            {speedState?.ul != null ? (speedState.ul === '—' ? '—' : `${speedState.ul} Mbps`) : (result.output.uploadMbps ? `${result.output.uploadMbps} Mbps` : '—')}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Ping</div>
                          <div className="mt-1 text-2xl font-semibold">
                            {speedState?.ping != null ? (speedState.ping === '—' ? '—' : `${speedState.ping} ms`) : (result.output.pingMs ? `${result.output.pingMs} ms` : '—')}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={runSpeedTest}
                        disabled={speedState?.running}
                        className="rounded-2xl bg-slate-100 px-4 py-3 font-medium text-slate-950 transition hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {speedState?.running ? 'Running…' : 'Run speed test'}
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    {result.actions.map((a) => (
                      <button
                        key={a}
                        onClick={() => {
                          if (a === 'copy') {
                            const copyValue =
                              result.type === 'password' ? result.output.password as string
                              : result.type === 'qr' ? result.output.value as string
                              : (result.output.formatted as string) || JSON.stringify(result.output, null, 2);
                            copyText(copyValue);
                            setStatus('Copied to clipboard');
                          }
                          if (a === 'pin') {
                            setPinned((prev) => [result.input, ...prev.filter((x) => x !== result.input)].slice(0, 12));
                            setStatus('Pinned command');
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
                  <span className="text-xs text-slate-500">{pinned.length}/12</span>
                </div>
                {pinned.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-4 text-sm text-slate-400">
                    Pin commands from results or use <span className="font-mono text-slate-300">pin [command]</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pinned.map((item) => (
                      <div key={item} className="flex items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                        <button className="text-left text-sm text-slate-200 hover:text-white" onClick={() => runSuggestion(item)}>
                          {item}
                        </button>
                        <button
                          onClick={() => setPinned((prev) => prev.filter((x) => x !== item))}
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
                      onChange={(e) => setPrefs((p) => ({ ...p, passwordLength: Number(e.target.value || 16) }))}
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-slate-500"
                    />
                  </label>
                  <label className="grid gap-1 text-sm text-slate-300">
                    Default password mode
                    <select
                      value={prefs.passwordMode}
                      onChange={(e) => setPrefs((p) => ({ ...p, passwordMode: e.target.value }))}
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-slate-500"
                    >
                      <option value="weak">weak</option>
                      <option value="medium">medium</option>
                      <option value="strong">strong</option>
                    </select>
                  </label>
                  <div className="text-sm text-slate-400">
                    Tip: use <span className="font-mono text-slate-200">gen password</span>, <span className="font-mono text-slate-200">qr ...</span>, <span className="font-mono text-slate-200">100 usd to myr</span>
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
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-4 text-sm text-slate-400">No commands yet.</div>
              ) : (
                <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setResult(item)}
                      className="block w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-left hover:bg-slate-800"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium text-slate-200">{item.input}</div>
                        <div className="text-xs text-slate-500">{item.type}</div>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10">
              <h3 className="text-lg font-semibold">Notes</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-400">
                <li>QR generation uses the built-in qrcode.react library — works offline.</li>
                <li>Currency conversion is manual/static here. Replace it with a real rate source if you need live FX.</li>
                <li>Speed test downloads a public library file via CDN. For production, use your own test file or backend endpoint.</li>
              </ul>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
