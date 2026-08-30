export function convertRadix(value: string, fromBase: number, toBase: number) {
  const n = parseInt(value, fromBase);
  if (isNaN(n)) throw new Error('Invalid input for source radix');
  return n.toString(toBase).toUpperCase();
}

export function bitwiseOp(a: number, b: number, op: string) {
  switch (op) {
    case 'AND': return a & b;
    case 'OR': return a | b;
    case 'XOR': return a ^ b;
    case 'NOT': return ~a;
    case '<<': return a << b;
    case '>>': return a >> b;
    case '>>>': return a >>> b;
    default: throw new Error('Unknown operation');
  }
}

export function inspectBits(n: number, bits = 32) {
  const result: boolean[] = [];
  for (let i = bits - 1; i >= 0; i--) result.push(Boolean((n >> i) & 1));
  return result;
}

export function binaryDump(text: string) {
  const bytes = new TextEncoder().encode(text);
  return Array.from(bytes).map((b) => ({
    hex: b.toString(16).padStart(2, '0'),
    binary: b.toString(2).padStart(8, '0'),
    dec: b,
  }));
}
