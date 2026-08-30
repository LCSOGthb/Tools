export function isMathExpression(input: string) {
  return /^[0-9+\-*/%^().,\s]+$/.test(input) && /\d/.test(input);
}

export function safeMathEval(expression: string) {
  const cleaned = expression.replace(/,/g, ".").replace(/\^/g, "**");
  if (!/^[0-9+\-*/%().*\s**]+$/.test(cleaned.replace(/\*\*/g, "")))
    throw new Error("Invalid expression");
  const result = Function(`"use strict"; return (${cleaned});`)();
  if (typeof result !== "number" || !Number.isFinite(result))
    throw new Error("Invalid result");
  return result as number;
}
