export const UNIT_TABLE: Record<string, Record<string, number>> = {
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

export function findUnitCategory(unit: string) {
  for (const [category, map] of Object.entries(UNIT_TABLE)) {
    if (Object.prototype.hasOwnProperty.call(map, unit)) return category;
  }
  return null;
}

export function convertUnits(value: number, from: string, to: string) {
  const category = findUnitCategory(from);
  if (!category || findUnitCategory(to) !== category)
    throw new Error("Unsupported unit pair");
  const base = value * UNIT_TABLE[category][from];
  return base / UNIT_TABLE[category][to];
}

export function getUnitsForCategory(category: string) {
  return Object.keys(UNIT_TABLE[category] ?? {});
}

export function getAllUnitCategories() {
  return Object.keys(UNIT_TABLE);
}
