export const STORAGE_KEYS = {
  history: "ptc_history_v1",
  pins: "ptc_pins_v1",
  prefs: "ptc_prefs_v1",
  recentTools: "recent_tools_v1",
} as const;

export const DEFAULT_PREFS = {
  passwordLength: 16,
  passwordMode: "strong",
  defaultCurrencyFrom: "usd",
  defaultCurrencyTo: "myr",
};

export function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

export function trackRecentTool(slug: string) {
  const recent = loadJson<string[]>(STORAGE_KEYS.recentTools, []);
  const updated = [slug, ...recent.filter((s) => s !== slug)].slice(0, 12);
  saveJson(STORAGE_KEYS.recentTools, updated);
}
