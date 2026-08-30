export function parseLines(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function setUnion(a: string[], b: string[]) {
  return [...new Set([...a, ...b])].sort();
}

export function setIntersection(a: string[], b: string[]) {
  const setB = new Set(b);
  return a.filter((x) => setB.has(x)).sort();
}

export function setDifference(a: string[], b: string[]) {
  const setB = new Set(b);
  return a.filter((x) => !setB.has(x)).sort();
}

export function setSymmetricDiff(a: string[], b: string[]) {
  const setA = new Set(a);
  const setB = new Set(b);
  return [
    ...a.filter((x) => !setB.has(x)),
    ...b.filter((x) => !setA.has(x)),
  ].sort();
}

export function setMembership(item: string, set: string[]) {
  return set.includes(item);
}

export function setDedupe(items: string[]) {
  return [...new Set(items)].sort();
}
