import { useState, useMemo } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import {
  chmodSymbolicToOctal,
  decodePermissionLine,
  parseCronExpression,
  cronNextTimes,
  buildCronExpression,
  posixJoin,
  posixDirname,
  posixBasename,
  posixExtname,
  posixNormalize,
  UID_GID_TABLE,
  lookupUidGid,
  type PermissionBreakdown,
  type CronSchedule,
} from "@/lib/tools/linux";
import {
  Field,
  TextInput,
  NumInput,
  SelectInput,
  ToggleInput,
  OutBox,
  Chip,
} from "@/components/tools/shared/fields";

const CHAR_BITS = ["r", "w", "x"] as const;
const ROW_LABELS = ["Owner", "Group", "Others"];

function octStrToBits(oct: string): boolean[][] | null {
  const s = oct.trim().replace(/\s+/g, "");
  if (!/^[0-7]{1,3}$/.test(s)) return null;
  const digits = s.padStart(3, "0").split("").map(Number);
  return digits.map((d) => [Boolean(d & 4), Boolean(d & 2), Boolean(d & 1)]);
}

function symToBits(sym: string): boolean[][] | null {
  const s = sym.trim().replace(/\s+/g, "");
  if (!s) return null;
  if (/^[rwx-]{9}$/.test(s)) {
    return [0, 1, 2].map((g) => [
      s[g * 3] === "r",
      s[g * 3 + 1] === "w",
      s[g * 3 + 2] === "x",
    ]);
  }
  try {
    return octStrToBits(chmodSymbolicToOctal(s));
  } catch {
    return null;
  }
}

function bitsToOctStr(bits: boolean[][]): string {
  return bits
    .map((row) => row.reduce((acc, on, i) => acc + (on ? [4, 2, 1][i] : 0), 0))
    .join("");
}

function bitsToSym(bits: boolean[][]): string {
  return bits
    .map((row) => row.map((on, i) => (on ? CHAR_BITS[i] : "-")).join(""))
    .join("");
}

function bitsText(bits: boolean[][]): string {
  return bits.map((row) => row.map((b) => (b ? "1" : "0")).join("")).join(" ");
}

function ChmodPanel() {
  const [bits, setBits] = useState<boolean[][]>([
    [true, true, true],
    [true, false, true],
    [true, false, true],
  ]);
  const [octInput, setOctInput] = useState("755");
  const [symInput, setSymInput] = useState("rwxr-xr-x");

  const applyBits = (next: boolean[][]) => {
    setBits(next);
    setOctInput(bitsToOctStr(next));
    setSymInput(bitsToSym(next));
  };

  const onOct = (v: string) => {
    setOctInput(v);
    const next = octStrToBits(v);
    if (next) {
      setBits(next);
      setSymInput(bitsToSym(next));
    }
  };

  const onSym = (v: string) => {
    setSymInput(v);
    const next = symToBits(v);
    if (next) {
      setBits(next);
      setOctInput(bitsToOctStr(next));
    }
  };

  const toggle = (row: number, col: number) => {
    applyBits(
      bits.map((r, ri) =>
        r.map((on, ci) => (ri === row && ci === col ? !on : on)),
      ),
    );
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Octal">
          <TextInput
            value={octInput}
            onChange={(e) => onOct(e.target.value)}
            spellCheck={false}
            placeholder="e.g. 755"
            inputMode="numeric"
          />
        </Field>
        <Field label="Symbolic">
          <TextInput
            value={symInput}
            onChange={(e) => onSym(e.target.value)}
            spellCheck={false}
            placeholder="e.g. rwxr-xr-x"
          />
        </Field>
      </div>
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="grid grid-cols-4 gap-2">
          <div />
          {CHAR_BITS.map((c) => (
            <div key={c} className="text-center text-xs text-muted-foreground">
              {c}
            </div>
          ))}
          {ROW_LABELS.map((label, row) => (
            <div key={label} className="contents">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </div>
              {bits[row].map((on, col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => toggle(row, col)}
                  aria-label={`${label} ${CHAR_BITS[col]}`}
                  className={`h-9 w-9 rounded-lg border transition ${
                    on
                      ? "border-ring bg-ring/20 text-foreground"
                      : "border-border bg-background/60 text-muted-foreground"
                  }`}
                >
                  {on ? "✓" : "–"}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        bits <span className="font-mono text-foreground">{bitsText(bits)}</span>{" "}
        — octal{" "}
        <span className="font-mono text-foreground">{bitsToOctStr(bits)}</span>{" "}
        — symbolic{" "}
        <span className="font-mono text-foreground">{bitsToSym(bits)}</span>
      </p>
    </div>
  );
}

function PermissionsPanel() {
  const [input, setInput] = useState("drwxr-xr-x");
  const parsed = useMemo(() => {
    try {
      return {
        data: decodePermissionLine(input.trim() + " ") as PermissionBreakdown,
        error: null as string | null,
      };
    } catch (e) {
      return {
        data: null as PermissionBreakdown | null,
        error: (e as Error).message,
      };
    }
  }, [input]);

  return (
    <div className="grid gap-4">
      <Field label="Permission line (like from `ls -l`)">
        <TextInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          placeholder="drwxr-xr-x or -rw-r--r--"
        />
      </Field>
      {parsed.error ? (
        <p className="text-red-400 text-sm">{parsed.error}</p>
      ) : (
        parsed.data && (
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Chip color="bg-ring/15 text-ring">{parsed.data.type}</Chip>
              <Chip color="bg-border/60 text-foreground">
                {parsed.data.symbolic}
              </Chip>
              <Chip color="bg-blue-500/15 text-blue-400">
                octal {parsed.data.octal}
              </Chip>
              {parsed.data.special.setuid && (
                <Chip color="bg-amber-500/15 text-amber-400">
                  setuid (+4000)
                </Chip>
              )}
              {parsed.data.special.setgid && (
                <Chip color="bg-amber-500/15 text-amber-400">
                  setgid (+2000)
                </Chip>
              )}
              {parsed.data.special.sticky && (
                <Chip color="bg-amber-500/15 text-amber-400">
                  sticky (+1000)
                </Chip>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {parsed.data.rows.map((r) => (
                <div
                  key={r.who}
                  className="rounded-xl border border-border bg-background/60 p-3"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {r.who}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3 font-mono text-sm">
                    <span
                      className={
                        r.r ? "text-green-400" : "text-muted-foreground/40"
                      }
                    >
                      {r.r ? "✓ r" : "✗ r"}
                    </span>
                    <span
                      className={
                        r.w ? "text-green-400" : "text-muted-foreground/40"
                      }
                    >
                      {r.w ? "✓ w" : "✗ w"}
                    </span>
                    <span
                      className={
                        r.x ? "text-green-400" : "text-muted-foreground/40"
                      }
                    >
                      {r.x ? "✓ x" : "✗ x"}
                    </span>
                  </div>
                  {r.special && (
                    <p className="mt-1 text-xs text-amber-400/80">
                      special bit set
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}

function ScheduleDisplay({ s }: { s: CronSchedule }) {
  const fields: Array<[string, number[]]> = [
    ["minute", s.minute],
    ["hour", s.hour],
    ["day", s.day],
    ["month", s.month],
    ["weekday", s.weekday],
  ];
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4">
      <div className="grid gap-2 text-sm sm:grid-cols-5">
        {fields.map(([label, values]) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-background/60 p-2.5"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {label} · {values.length} value{values.length === 1 ? "" : "s"}
            </p>
            <p
              className="mt-1 truncate font-mono text-xs text-foreground"
              title={values.join(", ")}
            >
              {values.slice(0, 14).join(",")}
              {values.length > 14 ? "…" : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CronParserPanel() {
  const [input, setInput] = useState("*/5 * * * *");
  const parsed = useMemo(() => {
    const parts = input.trim().split(/\s+/).filter(Boolean);
    const six = parts.length === 6;
    const use = six ? parts.slice(1).join(" ") : parts.join(" ");
    try {
      const schedule = parseCronExpression(use);
      return {
        schedule,
        next: cronNextTimes(use, 5),
        six,
        secondsField: six ? parts[0] : null,
        error: null as string | null,
      };
    } catch (e) {
      return {
        schedule: null as null,
        next: [] as Date[],
        six: false,
        secondsField: null as null,
        error: (e as Error).message,
      };
    }
  }, [input]);

  return (
    <div className="grid gap-4">
      <Field label="Expression (5 or 6 fields)">
        <TextInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          placeholder="*/5 * * * *"
        />
      </Field>
      {parsed.error && <p className="text-red-400 text-sm">{parsed.error}</p>}
      {parsed.schedule && (
        <>
          {parsed.six && (
            <Chip color="bg-amber-500/15 text-amber-400">
              6-field form detected — seconds field “{parsed.secondsField}” is
              shown but skipped for scheduling
            </Chip>
          )}
          <ScheduleDisplay s={parsed.schedule} />
          <div className="space-y-1.5">
            <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
              Next 5 runs
            </span>
            <OutBox
              value={parsed.next.map((d) => d.toLocaleString()).join("\n")}
              mono
            />
          </div>
        </>
      )}
    </div>
  );
}

function CronRow({
  label,
  mode,
  onMode,
  val,
  onVal,
  options,
  placeholder,
}: {
  label: string;
  mode: string;
  onMode: (v: string) => void;
  val: string;
  onVal: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <SelectInput
          value={mode}
          onChange={(e) => onMode(e.target.value)}
          options={options}
          className="w-36"
        />
        {mode === "custom" && (
          <NumInput
            value={val}
            onChange={(e) => onVal(e.target.value)}
            placeholder={placeholder}
            min={0}
          />
        )}
      </div>
    </Field>
  );
}

function CronGeneratorPanel() {
  const [minMode, setMinMode] = useState("*");
  const [minVal, setMinVal] = useState("0");
  const [hourMode, setHourMode] = useState("*");
  const [hourVal, setHourVal] = useState("12");
  const [domMode, setDomMode] = useState("*");
  const [domVal, setDomVal] = useState("1");
  const [monMode, setMonMode] = useState("*");
  const [monVal, setMonVal] = useState("1");
  const [dowMode, setDowMode] = useState("*");
  const [dowVal, setDowVal] = useState("0");
  const [secondsOn, setSecondsOn] = useState(false);

  const fields = {
    minute: minMode === "custom" ? minVal : minMode,
    hour: hourMode === "custom" ? hourVal : hourMode,
    day: domMode === "custom" ? domVal : domMode,
    month: monMode === "custom" ? monVal : monMode,
    weekday: dowMode === "custom" ? dowVal : dowMode,
  };
  const exp = buildCronExpression(fields);
  const full = secondsOn ? `0 ${exp}` : exp;
  const next = useMemo(() => {
    try {
      return cronNextTimes(exp, 5);
    } catch {
      return [];
    }
  }, [exp]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <CronRow
          label="Minute"
          mode={minMode}
          onMode={setMinMode}
          val={minVal}
          onVal={setMinVal}
          options={["*", "*/5", "*/10", "custom"]}
          placeholder="0-59"
        />
        <CronRow
          label="Hour"
          mode={hourMode}
          onMode={setHourMode}
          val={hourVal}
          onVal={setHourVal}
          options={["*", "custom"]}
          placeholder="0-23"
        />
        <CronRow
          label="Day of month"
          mode={domMode}
          onMode={setDomMode}
          val={domVal}
          onVal={setDomVal}
          options={["*", "custom"]}
          placeholder="1-31"
        />
        <CronRow
          label="Month"
          mode={monMode}
          onMode={setMonMode}
          val={monVal}
          onVal={setMonVal}
          options={["*", "custom"]}
          placeholder="1-12"
        />
        <CronRow
          label="Day of week (0=sun)"
          mode={dowMode}
          onMode={setDowMode}
          val={dowVal}
          onVal={setDowVal}
          options={["*", "custom"]}
          placeholder="0-6"
        />
        <ToggleInput
          label="Include seconds field"
          checked={secondsOn}
          onChange={setSecondsOn}
        />
      </div>
      <OutBox value={full} mono />
      {next.length > 0 && (
        <div className="space-y-1.5">
          <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
            Next 5 runs
          </span>
          <OutBox value={next.map((d) => d.toLocaleString()).join("\n")} mono />
        </div>
      )}
    </div>
  );
}

const PATH_EXAMPLES = [
  "/usr/local/bin",
  "/etc/nginx/sites-available/default",
  "/home/user/projects/tool.tar.gz",
  "./build/../src/./app.tsx",
];

function PathPanel() {
  const [input, setInput] = useState("/usr/local/bin/node");
  const rows = useMemo(() => {
    const p = input.trim();
    return [
      { label: "join('/a','b','c')", value: posixJoin("/a", "b", "c") },
      { label: "dirname", value: posixDirname(p) },
      { label: "basename", value: posixBasename(p) },
      { label: "extname", value: posixExtname(p) || "(none)" },
      { label: "normalize", value: posixNormalize(p) },
    ];
  }, [input]);

  return (
    <div className="grid gap-4">
      <Field label="Path">
        <TextInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          placeholder="/path/to/something"
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        {PATH_EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setInput(ex)}
            className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            {ex}
          </button>
        ))}
      </div>
      <div className="grid gap-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/60 px-3.5 py-2.5 text-sm"
          >
            <span className="text-muted-foreground">{r.label}</span>
            <span className="break-all font-mono text-foreground">
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UidGidPanel() {
  const [q, setQ] = useState("");
  const rows = useMemo(
    () => (q.trim() ? lookupUidGid(q.trim()) : UID_GID_TABLE),
    [q],
  );

  return (
    <div className="grid gap-4">
      <Field label="Search by name, uid, or gid">
        <TextInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          spellCheck={false}
          placeholder="try: root, 33, www, 999"
        />
      </Field>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card/60 p-2">
        <table className="w-full text-left font-mono text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2">name</th>
              <th className="px-3 py-2">uid</th>
              <th className="px-3 py-2">gid</th>
              <th className="px-3 py-2">description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="odd:bg-background/30">
                <td className="px-3 py-1.5 text-foreground">{r.name}</td>
                <td className="px-3 py-1.5 text-ring">{r.uid}</td>
                <td className="px-3 py-1.5 text-muted-foreground">{r.gid}</td>
                <td className="px-3 py-1.5 text-muted-foreground">
                  {r.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="px-3 py-3 text-sm text-muted-foreground">
            No entries match “{q}”.
          </p>
        )}
      </div>
    </div>
  );
}

export default function LinuxTools({ tool }: ToolPageProps) {
  switch (tool.slug) {
    case "chmod-calculator":
      return <ChmodPanel />;
    case "permissions-decoder":
      return <PermissionsPanel />;
    case "cron-parser":
      return <CronParserPanel />;
    case "cron-generator":
      return <CronGeneratorPanel />;
    case "path-utils":
      return <PathPanel />;
    case "uid-gid-table":
      return <UidGidPanel />;
    default:
      return null;
  }
}
