// Linux / sysadmin helpers — pure calculators and parsers, no shell execution.

const MODE_BITS: Array<[key: string, value: number]> = [
  ["r", 4],
  ["w", 2],
  ["x", 1],
];

function modeSymbolsForOct(oct: number): string {
  const digits = String(oct).padStart(3, "0").slice(-3);
  let out = "";
  for (const d of digits) {
    const bits = Number(d);
    let s = "";
    for (const [ch, v] of MODE_BITS) s += bits & v ? ch : "-";
    out += s;
  }
  return out;
}

function octForSymbols(symbols: string): number {
  const clean = symbols.replace(/-/g, "").toLowerCase();
  let sum = 0;
  for (const ch of clean) {
    const hit = MODE_BITS.find(([k, v]) => k === ch);
    if (hit) sum += hit[1];
  }
  return sum;
}

export function chmodSymbolicToOctal(symbolic: string): string {
  const parts = symbolic
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  let result = 0;
  for (const part of parts) {
    const m = part.match(/^([ugoa]*)([+\-=])([rwx]*)$/);
    if (!m) throw new Error(`Invalid symbolic mode: "${part}"`);
    const [, targets, op, perms] = m;
    const targetSet = targets === "" ? ["u", "g", "o"] : targets.split("");
    const value = perms
      .split("")
      .reduce((acc, p) => acc + (p === "r" ? 4 : p === "w" ? 2 : 1), 0);
    const masked = targetSet.reduce((acc, t) => {
      const shift = t === "u" ? 2 : t === "g" ? 1 : 0;
      return acc | (value << (shift * 3));
    }, 0);
    if (op === "+") result |= masked;
    else if (op === "-") result &= ~masked;
    else {
      const clear = targetSet.reduce((acc, t) => {
        const shift = t === "u" ? 2 : t === "g" ? 1 : 0;
        return acc | (7 << (shift * 3));
      }, 0);
      result = (result & ~clear) | masked;
    }
  }
  return result.toString(8).padStart(3, "0");
}

export function chmodOctalToSymbolic(oct: number | string): string {
  const n = typeof oct === "string" ? parseInt(oct, 8) : oct;
  if (isNaN(n) || n < 0 || n > 777)
    throw new Error("Octal mode must be between 000 and 777");
  return modeSymbolsForOct(n);
}

export function chmodOctalToBits(oct: number | string) {
  const n = typeof oct === "string" ? parseInt(oct, 8) : oct;
  const digits = n.toString(8).padStart(3, "0").slice(-3).split("").map(Number);
  return digits.map((d) =>
    MODE_BITS.map(([ch]) => Boolean(d & (ch === "r" ? 4 : ch === "w" ? 2 : 1))),
  );
}

export function chmodBitsToOctal(bits: boolean[][]) {
  const rows = bits.slice(0, 3);
  let out = "";
  for (const row of rows) {
    const v = row.reduce((acc, on, i) => acc + (on ? [4, 2, 1][i] : 0), 0);
    out += v;
  }
  return out;
}

export interface PermissionBreakdown {
  type: string;
  symbolic: string;
  octal: string;
  rows: Array<{
    who: string;
    r: boolean;
    w: boolean;
    x: boolean;
    special: boolean;
  }>;
  special: { setuid: boolean; setgid: boolean; sticky: boolean };
  human: string;
}

export function decodePermissionLine(line: string): PermissionBreakdown {
  const m = line.match(/^([-dbclps])([rwxsStT-]{9})(?:\s|$)/);
  if (!m)
    throw new Error(
      "Not a valid `ls -l` permission line (expected e.g. drwxr-xr-x)",
    );
  const [, typeCh, perms] = m;
  const typeMap: Record<string, string> = {
    d: "Directory",
    "-": "File",
    l: "Symbolic link",
    b: "Block device",
    c: "Character device",
    p: "Named pipe",
    s: "Socket",
  };
  const rows: PermissionBreakdown["rows"] = [];
  for (let i = 0; i < 3; i++) {
    const chunk = perms.slice(i * 3, i * 3 + 3);
    rows.push({
      who: ["Owner (user)", "Group", "Others"][i],
      r: chunk[0] === "r",
      w: chunk[1] === "w",
      x: chunk[2] === "x" || chunk[2] === "s" || chunk[2] === "t",
      special:
        chunk[2] === "s" ||
        chunk[2] === "S" ||
        chunk[2] === "t" ||
        chunk[2] === "T",
    });
  }
  let octal = 0;
  for (const row of rows) {
    octal = octal * 8 + (row.r ? 4 : 0) + (row.w ? 2 : 0) + (row.x ? 1 : 0);
  }
  const special = {
    setuid: perms[2] === "s" || perms[2] === "S",
    setgid: perms[5] === "s" || perms[5] === "S",
    sticky: perms[8] === "t" || perms[8] === "T",
  };
  if (special.setuid) octal += 4000;
  if (special.setgid) octal += 2000;
  if (special.sticky) octal += 1000;
  const human = rows
    .map(
      (r) =>
        `${r.who}: ${r.r ? "read" : "no read"} / ${r.w ? "write" : "no write"} / ${r.x ? "execute" : "no execute"}`,
    )
    .join("\n");
  return {
    type: typeMap[typeCh] ?? typeCh,
    symbolic: perms,
    octal: String(octal).padStart(4, "0"),
    rows,
    special,
    human,
  };
}

export function chmodBinaryToOctal(checkboxes: Array<Array<boolean>>): string {
  return chmodBitsToOctal(checkboxes).padStart(3, "0");
}

// ---- cron ----

const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const MONTH_NAMES = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

function expandCronField(
  field: string,
  min: number,
  max: number,
  names: string[] = [],
): number[] {
  const result = new Set<number>();
  const named = (v: string) => {
    const lower = v.toLowerCase();
    if (names.length) {
      const idx = names.findIndex((n) => n === lower || n.startsWith(lower));
      if (idx >= 0) return idx;
    }
    return Number(v);
  };
  for (const part of field.split(",")) {
    if (part === "*") {
      for (let i = min; i <= max; i++) result.add(i);
      continue;
    }
    const stepMatch = part.match(/^(.+)\/(\d+)$/);
    if (stepMatch) {
      const [, base, stepStr] = stepMatch;
      const step = Math.max(1, Number(stepStr));
      const range =
        base === "*" ? [min, max] : base.split("-").map((v) => named(v));
      for (let i = range[0]; i <= range[1]; i += step) result.add(i);
      continue;
    }
    if (part.includes("-")) {
      const [a, b] = part.split("-").map((v) => named(v));
      for (let i = a; i <= b; i++) result.add(i);
      continue;
    }
    result.add(named(part));
  }
  return [...result].filter((v) => v >= min && v <= max).sort((a, b) => a - b);
}

export interface CronSchedule {
  minute: number[];
  hour: number[];
  day: number[];
  month: number[];
  weekday: number[];
  expression: string;
}

export function parseCronExpression(expression: string): CronSchedule {
  const parts = expression.trim().split(/\s+/);
  const n = parts.length;
  if (n !== 5 && n !== 6)
    throw new Error(
      "Cron must have 5 or 6 fields: minute hour day month weekday (or seconds minute hour day month weekday)",
    );
  const useSeconds = n === 6;
  const minuteField = useSeconds ? parts[2] : parts[0];
  const hourField = useSeconds ? parts[3] : parts[1];
  const dayField = useSeconds ? parts[4] : parts[2];
  const monthField = useSeconds ? parts[5] : parts[3];
  const weekdayField = useSeconds ? parts[5] : parts[4];
  return {
    minute: expandCronField(minuteField, 0, 59),
    hour: expandCronField(hourField, 0, 23),
    day: expandCronField(dayField, 1, 31),
    month: expandCronField(monthField, 1, 12, MONTH_NAMES),
    weekday: expandCronField(weekdayField, 0, 6, DAY_NAMES),
    expression,
  };
}

export function cronNextTimes(
  expression: string,
  count = 5,
  from = new Date(),
): Date[] {
  const s = parseCronExpression(expression);
  const matches = (d: Date) => {
    const min = d.getMinutes();
    const hr = d.getHours();
    const day = d.getDate();
    const mon = d.getMonth() + 1;
    const wd = d.getDay();
    return (
      s.minute.includes(min) &&
      s.hour.includes(hr) &&
      s.month.includes(mon) &&
      (s.day.includes(day) || s.weekday.includes(wd))
    );
  };
  const out: Date[] = [];
  const cur = new Date(from);
  cur.setSeconds(0, 0);
  let guard = 0;
  while (out.length < count && guard < 100000) {
    guard++;
    if (matches(cur)) {
      out.push(new Date(cur));
      cur.setMinutes(cur.getMinutes() + 1);
    } else {
      cur.setMinutes(cur.getMinutes() + 1);
    }
  }
  return out;
}

export interface CronFields {
  minute: string;
  hour: string;
  day: string;
  month: string;
  weekday: string;
}

export function buildCronExpression(fields: CronFields): string {
  return `${fields.minute} ${fields.hour} ${fields.day} ${fields.month} ${fields.weekday}`;
}

// ---- paths ----

export function posixJoin(...parts: string[]): string {
  return (
    parts
      .flatMap((p) => p.split("/"))
      .reduce((acc, part) => {
        if (!part || part === ".") return acc;
        if (part === "..") {
          const s = acc.split("/");
          s.pop();
          return s.join("/");
        }
        return acc ? `${acc}/${part}` : part;
      }, "")
      .replace(/\/{2,}/g, "/") || "."
  );
}

export function posixDirname(p: string): string {
  const idx = p.lastIndexOf("/");
  if (idx === -1) return ".";
  return idx === 0 ? "/" : p.slice(0, idx);
}

export function posixBasename(p: string, ext?: string): string {
  const idx = p.lastIndexOf("/");
  const base = idx === -1 ? p : p.slice(idx + 1);
  if (ext && base.endsWith(ext)) return base.slice(0, -ext.length);
  return base;
}

export function posixExtname(p: string): string {
  const base = posixBasename(p);
  const idx = base.lastIndexOf(".");
  if (idx <= 0) return "";
  return base.slice(idx);
}

export function posixNormalize(p: string): string {
  const leadingSlash = p.startsWith("/");
  const trailingSlash = p.endsWith("/") && p.length > 1;
  const parts = p.split("/");
  const stack: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") {
      if (stack.length && stack[stack.length - 1] !== "..") stack.pop();
      else if (!leadingSlash) stack.push("..");
    } else stack.push(part);
  }
  let out = stack.join("/");
  if (leadingSlash) out = "/" + out;
  if (trailingSlash && out) out += "/";
  return out || (leadingSlash ? "/" : ".");
}

// ---- uid/gid reference ----

export const UID_GID_TABLE: Array<{
  name: string;
  uid: number;
  gid: number;
  description: string;
}> = [
  {
    name: "root",
    uid: 0,
    gid: 0,
    description: "Superuser / system administrator",
  },
  { name: "bin", uid: 1, gid: 1, description: "Executable binaries owner" },
  {
    name: "daemon",
    uid: 2,
    gid: 2,
    description: "Background system processes",
  },
  {
    name: "adm",
    uid: 3,
    gid: 4,
    description: "Administrative group / log files",
  },
  { name: "lp", uid: 4, gid: 7, description: "Printing subsystem" },
  { name: "sync", uid: 5, gid: 0, description: "Synchronize binaries" },
  { name: "shutdown", uid: 6, gid: 0, description: "Power off the system" },
  { name: "halt", uid: 7, gid: 0, description: "Halt the system" },
  { name: "mail", uid: 8, gid: 12, description: "Mail subsystem" },
  { name: "news", uid: 9, gid: 13, description: "News subsystem" },
  { name: "uucp", uid: 10, gid: 14, description: "UUCP subsystem" },
  { name: "operator", uid: 11, gid: 0, description: "Operator access" },
  { name: "games", uid: 12, gid: 100, description: "Games" },
  { name: "gopher", uid: 13, gid: 30, description: "Gopher server" },
  { name: "ftp", uid: 14, gid: 50, description: "FTP server" },
  {
    name: "nobody",
    uid: 65534,
    gid: 65534,
    description: "Unprivileged process user",
  },
  {
    name: "systemd-network",
    uid: 100,
    gid: 102,
    description: "systemd network management",
  },
  {
    name: "systemd-resolve",
    uid: 101,
    gid: 103,
    description: "systemd resolver",
  },
  { name: "sshd", uid: 74, gid: 74, description: "SSH daemon" },
  {
    name: "www-data",
    uid: 33,
    gid: 33,
    description: "Web server (Apache/Nginx)",
  },
  { name: "postgres", uid: 999, gid: 999, description: "PostgreSQL server" },
  { name: "mysql", uid: 27, gid: 27, description: "MySQL server" },
  { name: "redis", uid: 999, gid: 999, description: "Redis server" },
  {
    name: "vboxadd",
    uid: 999,
    gid: 999,
    description: "VirtualBox guest additions",
  },
];

export function lookupUidGid(query: string) {
  const q = query.toLowerCase();
  return UID_GID_TABLE.filter(
    (row) =>
      row.name.includes(q) || String(row.uid) === q || String(row.gid) === q,
  );
}
