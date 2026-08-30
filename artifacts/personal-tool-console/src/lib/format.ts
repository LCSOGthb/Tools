export function formatNumber(value: number, digits = 8) {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e9 || abs < 1e-6))
    return value.toExponential(6).replace(/\+/, "");
  return Number.parseFloat(value.toFixed(digits)).toString();
}

export function normalize(input: string) {
  return input.trim().replace(/\s+/g, " ").toLowerCase();
}
