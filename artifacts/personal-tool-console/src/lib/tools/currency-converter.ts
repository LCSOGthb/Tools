export const CURRENCY_RATES: Record<string, number> = {
  usd: 1,
  myr: 4.7,
  eur: 0.92,
  gbp: 0.78,
  jpy: 154,
  sgd: 1.35,
  aud: 1.51,
  idr: 15850,
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  usd: "$",
  myr: "RM",
  eur: "€",
  gbp: "£",
  jpy: "¥",
  sgd: "S$",
  aud: "A$",
  idr: "Rp",
};

export function convertCurrency(value: number, from: string, to: string) {
  if (!CURRENCY_RATES[from] || !CURRENCY_RATES[to])
    throw new Error("Unsupported currency");
  return (value / CURRENCY_RATES[from]) * CURRENCY_RATES[to];
}

export function getCurrencyCodes() {
  return Object.keys(CURRENCY_RATES);
}
