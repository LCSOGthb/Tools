'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react';

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

const UNIT_TABLE = {
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
    'm/s': 1,
    'km/h': 1000 / 3600,
    mph: 1609.344 / 3600,
    knot: 1852 / 3600,
  },
  area: {
    'm2': 1,
    'cm2': 0.0001,
    'km2': 1_000_000,
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

const CURRENCY_SYMBOLS = {
  usd: '$',
  myr: 'RM',
  eur: '€',
  gbp: '£',
  jpy: '¥',
  sgd: 'S$',
  aud: 'A$',
  idr: 'Rp',
};

function loadJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function formatNumber(value, digits = 8) {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e9 || abs < 1e-6)) {
    return value.toExponential(6).replace(/\+/, '');
  }
  return Number.parseFloat(value.toFixed(digits)).toString();
}

function normalize(input) {
  return input.trim().replace(/\s+/g, ' ').toLowerCase();
}

function isMathExpression(input) {
  return /^[0-9+\-*/%^().,\s]+$/.test(input) && /\d/.test(input);
}

function safeMathEval(expression) {
  const cleaned = expression.replace(/,/g, '.').replace(/\^/g, '**');
  if (!/^[0-9+\-*/%().*\s**]+$/.test(cleaned.replace(/\*\*/g, ''))) {
    throw new Error('Invalid expression');
  }
  // eslint-disable-next-line no-new-func
  const result = Function(`"use strict"; return (${cleaned});`)();
  if (typeof result !== 'number' || !Number.isFinite(result)) throw new Error('Invalid result');
  return result;
}

function parsePasswordCommand(input, prefs) {
  const m = input.match(/^(?:gen\s+)?password(?:\s+(\d{1,3}))?(?:\s+(weak|medium|strong))?$/i);
  if (!m) return null;
  return {
    type: 'password',
    length: Math.max(4, Math.min(128, Number(m[1] || prefs.passwordLength || 16))),
    mode: (m[2] || prefs.passwordMode || 'strong').toLowerCase(),
  };
}

function parseQrCommand(input) {
  if (!input.startsWith('qr ')) return null;
  const value = input.slice(3).trim();
  if (!value) return null;
  return { type: 'qr', value };
}

function parseConversion(input, prefs) {
  const currencyPattern = /^(?:(\d+(?:\.\d+)?)\s+)?([a-z]{3})\s+to\s+([a-z]{3})$/i;
  const unitPattern = /^(\d+(?:\.\d+)?)\s+([a-z\/0-9_]+)\s+to\s+([a-z\/0-9_]+)$/i;

  const cm = input.match(currencyPattern);
  if (cm) {
    const value = cm[1] ? Number(cm[1]) : 1;
    return {
      type: 'currency',
      value,
      from: cm[2].toLowerCase(),
      to: cm[3].toLowerCase(),
      note: 'Rates are local/manual in this prototype.',
      prefs,
    };
  }

  const um = input.match(unitPattern);
  if (!um) return null;
  const value = Number(um[1]);
  const from = um[2].toLowerCase();
  const to = um[3].toLowerCase();
  return { type: 'unit', value, from, to };
}

function findUnitCategory(unit) {
  for (const [category, map] of Object.entries(UNIT_TABLE)) {
    if (Object.prototype.hasOwnProperty.call(map, unit)) return category;
  }
  return null;
}

function convertUnits(value, from, to) {
  const category = findUnitCategory(from);
  if (!category || findUnitCategory(to) !== category) throw new Error('Unsupported unit pair');

  if (category === 'speed') {
    const base = value * UNIT_TABLE.speed[from];
    return base / UNIT_TABLE.speed[to];
  }

  if (category === 'area' || category === 'volume' || category === 'length' || category === 'mass') {
    const base = value * UNIT_TABLE[category][from];
    return base / UNIT_TABLE[category][to];
  }

  throw new Error('Unsupported unit category');
}

function convertCurrency(value, from, to) {
  const rates = {
    usd: 1,
    myr: 4.7,
    eur: 0.92,
    gbp: 0.78,
    jpy: 154,
    sgd: 1.35,
    aud: 1.51,
    idr: 15850,
  };
  if (!rates[from] || !rates[to]) throw new Error('Unsupported currency');
  const usd = value / rates[from];
  return usd * rates[to];
}

function randomPassword(length, mode) {
  const sets = {
    weak: 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789',
    medium: 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%?_-',
    strong: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{};:,.<>/?',
  };
  const chars = sets[mode] || sets.strong;
  const bytes = new Uint32Array(length);
  window.crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i += 1) out += chars[bytes[i] % chars.length];
  return out;
}

function strengthScore(pw) {
  let score = 0;
  if (pw.length >= 12) score += 1;
  if (pw.length >= 16) score += 1;
  if (/[a-z]/.test(pw)) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return score;
}

function resultLabel(type) {
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

function serializeAction(action) {
  return {
    ...action,
    ts: Date.now(),
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  };
}

function commandSuggestions(query) {
  const q = normalize(query);
  const all = [
    '100 usd to myr',
    '10 km to mi',
    '16 * 24 + 10',
    'gen password 16 strong',
    'qr https://example.com',
    'speed test',
  ];
  if (!q) return all;
  return all.filter((item) => item.includes(q)).slice(0, 6);
}

function App() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [pinned, setPinned] = useState([]);
  const [status, setStatus] = useState('Ready');
  const [speedState, setSpeedState] = useState(null);
  const inputRef = useRef(null);

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

  function addHistory(item) {
    setHistory((prev) => [item, ...prev].slice(0, 80));
  }

  function copyText(text) {
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  function executeCommand(raw, options = {}) {
    const normalized = normalize(raw);
    if (!normalized) return;

    let parsed = null;
    let output = null;
    let type = 'unknown';
    let actions = [];

    try {
      if (normalized === 'speed test' || normalized === 'speed') {
        type = 'speed';
        output = {
          title: 'Speed test is scaffolded',
          details: 'This prototype includes the UI and history, but a true browser speed test needs a test file or backend endpoint you control.',
        };
        setSpeedState({ running: false, dl: null, ul: null, ping: null });
        actions = ['configure speed endpoint'];
      } else if ((parsed = parsePasswordCommand(normalized, prefs))) {
        type = 'password';
        const pw = randomPassword(parsed.length, parsed.mode);
        output = {
          password: pw,
          score: strengthScore(pw),
          mode: parsed.mode,
          length: parsed.length,
        };
        actions = ['copy', 'pin'];
      } else if ((parsed = parseQrCommand(normalized))) {
        type = 'qr';
        output = {
          value: parsed.value,
          url: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(parsed.value)}`,
        };
        actions = ['copy', 'pin'];
      } else if ((parsed = parseConversion(normalized, prefs))) {
        if (parsed.type === 'currency') {
          type = 'currency';
          const converted = convertCurrency(parsed.value, parsed.from, parsed.to);
          output = {
            value: converted,
            formatted: `${CURRENCY_SYMBOLS[parsed.to] || parsed.to.toUpperCase()} ${formatNumber(converted, 6)}`,
            source: `${parsed.value} ${parsed.from.toUpperCase()}`,
            note: parsed.note,
          };
          actions = ['copy', 'pin'];
        } else {
          type = 'unit';
          const converted = convertUnits(parsed.value, parsed.from, parsed.to);
          output = {
            value: converted,
            formatted: `${formatNumber(converted, 8)} ${parsed.to}`,
            source: `${parsed.value} ${parsed.from}`,
          };
          actions = ['copy', 'pin'];
        }
      } else if (isMathExpression(normalized)) {
        type = 'math';
        const value = safeMathEval(normalized);
        output = {
          value,
          formatted: formatNumber(value, 10),
        };
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

      const record = {
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
      const record = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        input: raw,
        normalized,
        type: 'error',
        label: 'Error',
        output: { message: err.message || 'Command failed' },
        actions: [],
        createdAt: new Date().toISOString(),
      };
      setResult(record);
      addHistory(record);
      setStatus(record.output.message);
      return record;
    }
  }

  function runSuggestion(text) {
    setInput(text);
    inputRef.current?.focus();
    executeCommand(text);
  }

  function runSpeedTest() {
    const testUrl = 'https://speed.hetzner.de/10MB.bin';
    const started = performance.now();
    setSpeedState({ running: true, dl: null, ul: null, ping: null, message: 'Downloading a test payload…' });
    fetch(testUrl, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const reader = res.body?.getReader();
        if (!reader) throw new Error('Streaming not available in this browser');
        let loaded = 0;
        const total = Number(res.headers.get('content-length')) || 10 * 1024 * 1024;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          loaded += value.byteLength;
        }
        const seconds = (performance.now() - started) / 1000;
        const mbps = (loaded * 8) / seconds / 1_000_000;
        setSpeedState({ running: false, dl: mbps.toFixed(2), ul: '—', ping: '—', message: `${Math.round((loaded / total) * 100)}%` });
        const record = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          input: 'speed test',
          normalized: 'speed test',
          type: 'speed',
          label: 'Speed test',
          output: { downloadMbps: mbps.toFixed(2), note: 'Download estimate from a single download payload.' },
          actions: ['copy', 'pin'],
          createdAt: new Date().toISOString(),
        };
        setResult(record);
        addHistory(record);
        setStatus(`Speed test complete: ${mbps.toFixed(2)} Mbps`);
      })
      .catch((err) => {
        setSpeedState({ running: false, dl: null, ul: null, ping: null, message: err.message });
        setStatus(`Speed test failed: ${err.message}`);
      });
  }

  const suggestions = useMemo(() => commandSuggestions(input), [input]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Enter' && document.activeElement === inputRef.current) {
        e.preventDefault();
        if (normalize(input) === 'speed test' || normalize(input) === 'speed') runSpeedTest();
        else executeCommand(input);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [input, prefs]);

  const commandExamples = [
    '100 usd to myr',
    '10 km to mi',
    '16 * 24 + 10',
    'gen password 16 strong',
    'qr https://example.com',
    'speed test',
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-black/20 backdrop-blur">
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
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (normalize(input) === 'speed test' || normalize(input) === 'speed') runSpeedTest();
                    else executeCommand(input);
                  }
                }}
                placeholder="Type a command: 100 usd to myr, gen password 16 strong, qr https://..., 16*24+10"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-4 pr-24 text-base outline-none ring-0 placeholder:text-slate-500 focus:border-slate-500"
              />
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center gap-2 text-xs text-slate-500">
                <span className="rounded-lg border border-slate-800 px-2 py-1">Cmd</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => (normalize(input) === 'speed test' || normalize(input) === 'speed' ? runSpeedTest() : executeCommand(input))}
                className="rounded-2xl bg-slate-100 px-4 py-3 font-medium text-slate-950 transition hover:bg-white"
              >
                Run
              </button>
              <button
                onClick={() => setInput('')}
                className="rounded-2xl border border-slate-700 px-4 py-3 font-medium text-slate-200 transition hover:bg-slate-800"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => runSuggestion(s)}
                className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1.5 text-sm text-slate-300 transition hover:border-slate-500 hover:bg-slate-800"
              >
                {s}
              </button>
            ))}
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="space-y-6">
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
                  Run a command to see a structured result here.
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

                  {result.type === 'math' && (
                    <div>
                      <div className="text-sm text-slate-400">Answer</div>
                      <div className="mt-1 text-3xl font-semibold">{result.output.formatted}</div>
                    </div>
                  )}

                  {(result.type === 'unit' || result.type === 'currency') && (
                    <div>
                      <div className="text-sm text-slate-400">Converted</div>
                      <div className="mt-1 text-3xl font-semibold">{result.output.formatted}</div>
                      <div className="mt-2 text-sm text-slate-400">From {result.output.source}</div>
                      {result.output.note && <div className="mt-1 text-xs text-slate-500">{result.output.note}</div>}
                    </div>
                  )}

                  {result.type === 'password' && (
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-slate-400">Password</div>
                        <div className="mt-1 break-all rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 font-mono text-base">{result.output.password}</div>
                      </div>
                      <div className="text-sm text-slate-400">Strength score: {result.output.score}/6 · Mode: {result.output.mode} · Length: {result.output.length}</div>
                    </div>
                  )}

                  {result.type === 'qr' && (
                    <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
                      <img
                        src={result.output.url}
                        alt="QR code"
                        className="h-44 w-44 rounded-2xl border border-slate-800 bg-white p-3"
                      />
                      <div>
                        <div className="text-sm text-slate-400">Encoded value</div>
                        <div className="mt-1 break-all rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm">{result.output.value}</div>
                      </div>
                    </div>
                  )}

                  {result.type === 'speed' && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4">
                        <div className="text-sm text-slate-400">Speed test status</div>
                        <div className="mt-1 text-lg text-slate-100">{speedState?.message || result.output.title}</div>
                        <div className="mt-2 text-sm text-slate-400">This prototype can run a basic download-based estimate, but a robust speed test should use your own test endpoint.</div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Download</div>
                          <div className="mt-1 text-2xl font-semibold">{speedState?.dl ?? '—'} Mbps</div>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Upload</div>
                          <div className="mt-1 text-2xl font-semibold">{speedState?.ul ?? '—'}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Ping</div>
                          <div className="mt-1 text-2xl font-semibold">{speedState?.ping ?? '—'}</div>
                        </div>
                      </div>
                      <button
                        onClick={runSpeedTest}
                        className="rounded-2xl bg-slate-100 px-4 py-3 font-medium text-slate-950 transition hover:bg-white"
                      >
                        Run download test
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
                              result.type === 'password'
                                ? result.output.password
                                : result.type === 'qr'
                                  ? result.output.value
                                  : result.output.formatted || JSON.stringify(result.output, null, 2);
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

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Pinned shortcuts</h3>
                  <span className="text-xs text-slate-500">{pinned.length}/12</span>
                </div>
                {pinned.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-4 text-sm text-slate-400">Pin commands from results or use <span className="font-mono text-slate-300">pin ...</span>.</div>
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
                    Tip: use <span className="font-mono text-slate-200">gen password</span>, <span className="font-mono text-slate-200">qr ...</span>, <span className="font-mono text-slate-200">100 usd to myr</span>, or plain math.
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10">
              <h3 className="text-lg font-semibold">Examples</h3>
              <div className="mt-4 space-y-2">
                {commandExamples.map((cmd) => (
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

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10">
              <h3 className="text-lg font-semibold">Notes</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-400">
                <li>QR generation uses a public image endpoint for this prototype. Swap it for a local library before deploying.</li>
                <li>Currency conversion is manual/static here. Replace it with a real rate source if you need live FX.</li>
                <li>Speed test is scaffolded; the browser download test works only if the test URL is reachable and not blocked by CORS.</li>
              </ul>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}

export default App;
