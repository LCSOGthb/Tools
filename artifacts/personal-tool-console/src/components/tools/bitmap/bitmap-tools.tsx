import { useState, useMemo } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import { convertRadix, bitwiseOp, inspectBits, binaryDump } from "@/lib/tools/bitmap";
import { Field, TextInput, NumInput, SelectInput, TextArea } from "@/components/tools/shared/fields";

const BASES = [2, 8, 10, 16, 36];

function group8(bits: boolean[]) {
  const chunks: string[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    chunks.push(bits.slice(i, i + 8).map((b) => (b ? "1" : "0")).join(""));
  }
  return chunks.join(" ");
}

function RadixPanel() {
  const [value, setValue] = useState("FF");
  const [fromBase, setFromBase] = useState("16");
  const [toBase, setToBase] = useState("10");
  const computed = useMemo(() => {
    try {
      const parsed = parseInt(value.trim() || "0", Number(fromBase));
      if (Number.isNaN(parsed)) throw new Error(`"${value}" is not valid in base ${fromBase}`);
      if (!Number.isFinite(parsed)) throw new Error("Value is too large for a JS number");
      return {
        result: convertRadix(value.trim() || "0", Number(fromBase), Number(toBase)),
        rows: BASES.map((b) => ({ base: b, out: convertRadix(value.trim() || "0", Number(fromBase), b) })),
        error: null as string | null,
      };
    } catch (e) {
      return { result: "", rows: [], error: (e as Error).message };
    }
  }, [value, fromBase, toBase]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Value">
          <TextInput value={value} onChange={(e) => setValue(e.target.value)} spellCheck={false} placeholder="e.g. FF or 1010" />
        </Field>
        <Field label="From base">
          <SelectInput value={fromBase} onChange={(e) => setFromBase(e.target.value)} options={BASES.map(String)} />
        </Field>
        <Field label="To base">
          <SelectInput value={toBase} onChange={(e) => setToBase(e.target.value)} options={BASES.map(String)} />
        </Field>
      </div>
      {computed.error ? (
        <p className="text-red-400 text-sm">{computed.error}</p>
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-black/40 p-4">
            <p className="break-all font-mono text-3xl tracking-wider text-foreground">{computed.result}</p>
            <p className="text-xs text-muted-foreground/70">base {toBase}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card/60 p-4">
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
              {computed.rows.map((r) => (
                <div key={r.base} className="rounded-xl border border-border bg-background/60 p-2.5">
                  <p className="text-xs text-muted-foreground">base {r.base}</p>
                  <p className="truncate font-mono text-sm text-foreground" title={r.out}>{r.out}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BitwisePanel() {
  const [a, setA] = useState("10");
  const [b, setB] = useState("6");
  const [op, setOp] = useState("AND");
  const aNum = Number(a) || 0;
  const bNum = Number(b) || 0;
  const result = (() => {
    try {
      return bitwiseOp(aNum, bNum, op);
    } catch {
      return 0;
    }
  })();
  const row = (label: string, n: number) => (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="truncate font-mono text-sm text-foreground">{group8(inspectBits(n, 32))}</span>
    </div>
  );

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Operand A">
          <NumInput value={a} onChange={(e) => setA(e.target.value)} />
        </Field>
        <Field label="Operand B">
          <NumInput value={b} onChange={(e) => setB(e.target.value)} />
        </Field>
        <Field label="Operation">
          <SelectInput value={op} onChange={(e) => setOp(e.target.value)} options={["AND", "OR", "XOR", "NOT", "<<", ">>", ">>>"]} />
        </Field>
      </div>
      <p className="text-xs text-muted-foreground/70">Operands are treated as 32-bit two's complement integers. NOT ignores operand B.</p>
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="grid gap-3">
          {row("A", aNum)}
          {op !== "NOT" && row("B", bNum)}
          <div className="my-1 border-t border-border" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-ring">Result ({op})</span>
            <span className="text-xl font-mono text-foreground">{result}</span>
          </div>
          <span className="truncate font-mono text-sm text-foreground">{group8(inspectBits(result, 32))}</span>
        </div>
      </div>
    </div>
  );
}

function FlagsPanel() {
  const [bits, setBits] = useState("16");
  const [value, setValue] = useState(0b1010101010101010);
  const [text, setText] = useState("43690");
  const n = Number(bits);
  const mask = n === 32 ? 0xffffffff : (1 << n) - 1;
  const shown = value & mask;
  const bools = inspectBits(shown, n);

  const toggle = (i: number) => {
    const next = shown ^ (1 << (n - 1 - i));
    setValue(next);
    setText(String(next));
  };

  const changeText = (t: string) => {
    setText(t);
    const v = parseInt(t, 10);
    if (!Number.isNaN(v) && v >= 0) setValue(v);
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Width">
          <SelectInput value={bits} onChange={(e) => setBits(e.target.value)} options={["8", "16", "32"]} />
        </Field>
        <Field label="Decode value (decimal)">
          <TextInput value={text} onChange={(e) => changeText(e.target.value)} spellCheck={false} inputMode="numeric" placeholder="0" />
        </Field>
      </div>
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="flex flex-wrap gap-1.5">
          {bools.map((on, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              title={`bit ${n - 1 - i}`}
              className={`h-8 w-8 rounded-lg border font-mono text-xs transition ${
                on ? "border-ring bg-ring/25 text-foreground" : "border-border bg-background/60 text-muted-foreground"
              }`}
            >
              {on ? "1" : "0"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">decimal</span>
        <span className="font-mono text-foreground">{shown}</span>
        <span className="mx-1 text-muted-foreground">·</span>
        <span className="text-muted-foreground">hex</span>
        <span className="font-mono text-foreground">0x{shown.toString(16).toUpperCase().padStart(Math.ceil(n / 4), "0")}</span>
      </div>
    </div>
  );
}

function BinaryViewerPanel() {
  const [text, setText] = useState("Hello, world!");
  const rows = useMemo(() => binaryDump(text), [text]);
  const charOf = (d: number) => (d >= 32 && d <= 126 ? String.fromCharCode(d) : "·");

  return (
    <div className="grid gap-4">
      <Field label="Input text">
        <TextArea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} placeholder="Text to inspect byte by byte" />
      </Field>
      <p className="text-sm text-muted-foreground">{rows.length} bytes</p>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card/60 p-2">
        <table className="w-full text-left font-mono text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2">index</th>
              <th className="px-3 py-2">char</th>
              <th className="px-3 py-2">hex</th>
              <th className="px-3 py-2">binary</th>
              <th className="px-3 py-2">dec</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={i % 2 ? "bg-background/30" : ""}>
                <td className="px-3 py-1.5 text-muted-foreground">{i}</td>
                <td className="px-3 py-1.5 text-foreground">{charOf(r.dec)}</td>
                <td className="px-3 py-1.5 text-ring">{r.hex}</td>
                <td className="px-3 py-1.5 text-foreground">{r.binary}</td>
                <td className="px-3 py-1.5 text-muted-foreground">{r.dec}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function BitmapTools({ tool }: ToolPageProps) {
  switch (tool.slug) {
    case "radix-converter":
      return <RadixPanel />;
    case "bitwise-calculator":
      return <BitwisePanel />;
    case "bit-flags":
      return <FlagsPanel />;
    case "binary-viewer":
      return <BinaryViewerPanel />;
    default:
      return null;
  }
}