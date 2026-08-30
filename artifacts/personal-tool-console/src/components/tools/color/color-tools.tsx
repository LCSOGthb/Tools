import { useState, useMemo } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import {
  hexToRgbaString,
  rgbaToHex,
  shadeScale,
  mixColors,
  generatePalette,
  type PaletteScheme,
} from "@/lib/tools/color";
import {
  Field,
  TextInput,
  SelectInput,
  OutBox,
} from "@/components/tools/shared/fields";

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (v: string) => {
    navigator.clipboard?.writeText(v).catch(() => {});
    setCopied(v);
    window.setTimeout(() => setCopied((c) => (c === v ? null : c)), 1000);
  };
  return { copied, copy };
}

function Swatch({ hex, big = false }: { hex: string; big?: boolean }) {
  const { copied, copy } = useCopy();
  return (
    <button
      type="button"
      onClick={() => copy(hex)}
      title={`${hex} — click to copy`}
      className={`${big ? "h-14" : "h-10"} w-full rounded-xl border border-border/60 transition hover:scale-[1.02]`}
      style={{ backgroundColor: hex }}
    >
      <span
        className={`${copied === hex ? "opacity-100" : "opacity-0"} flex h-full items-center justify-center rounded-xl bg-black/40 text-xs font-medium text-white transition`}
      >
        {copied === hex ? "Copied" : ""}
      </span>
    </button>
  );
}

const SCHEMES: PaletteScheme[] = [
  "monochromatic",
  "complementary",
  "analogous",
  "triadic",
  "tetradic",
];

function PalettePanel() {
  const [seed, setSeed] = useState("#7c3aed");
  const [scheme, setScheme] = useState<PaletteScheme>("analogous");
  const [count, setCount] = useState(5);
  const colorValid = /^#[0-9a-fA-F]{3,6}$/.test(seed.trim());
  const palette = useMemo(() => {
    try {
      return {
        colors: generatePalette(seed.trim(), scheme, count),
        error: null as string | null,
      };
    } catch (e) {
      return { colors: [] as string[], error: (e as Error).message };
    }
  }, [seed, scheme, count]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Seed color">
          <div className="flex gap-2">
            <input
              type="color"
              value={colorValid ? seed.trim().toLowerCase() : "#7c3aed"}
              onChange={(e) => setSeed(e.target.value)}
              className="h-10 w-12 shrink-0 cursor-pointer rounded-xl border border-border bg-background/80"
            />
            <TextInput
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              spellCheck={false}
              placeholder="#7c3aed"
            />
          </div>
        </Field>
        <Field label="Scheme">
          <SelectInput
            value={scheme}
            onChange={(e) => setScheme(e.target.value as PaletteScheme)}
            options={SCHEMES}
          />
        </Field>
        <Field label={`Count: ${count}`}>
          <input
            type="range"
            min={3}
            max={9}
            step={1}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full accent-foreground"
          />
        </Field>
      </div>
      {palette.error ? (
        <p className="text-red-400 text-sm">{palette.error}</p>
      ) : (
        <>
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            {palette.colors.map((c) => (
              <div
                key={c}
                className="h-full flex-1"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {palette.colors.map((c) => (
              <div key={c} className="grid gap-1.5">
                <Swatch hex={c} big />
                <p className="text-center font-mono text-xs text-muted-foreground">
                  {c}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function HexToRgbaPanel() {
  const [hex, setHex] = useState("#7c3aed");
  const [alpha, setAlpha] = useState(65);
  const computed = useMemo(() => {
    try {
      const a = alpha / 100;
      return {
        value: hexToRgbaString(hex.trim(), a),
        error: null as string | null,
      };
    } catch (e) {
      return { value: "", error: (e as Error).message };
    }
  }, [hex, alpha]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Hex color">
          <TextInput
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            spellCheck={false}
            placeholder="#7c3aed"
          />
        </Field>
        <Field label={`Alpha: ${alpha}%`}>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={alpha}
            onChange={(e) => setAlpha(Number(e.target.value))}
            className="w-full accent-foreground"
          />
        </Field>
      </div>
      {computed.error ? (
        <p className="text-red-400 text-sm">{computed.error}</p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-xl border border-border/60"
              style={{ backgroundColor: computed.value }}
            />
            <span className="font-mono text-sm text-foreground">
              {computed.value}
            </span>
          </div>
          <OutBox value={computed.value} mono />
        </>
      )}
    </div>
  );
}

function RgbaToHexPanel() {
  const [rgba, setRgba] = useState("rgba(124, 58, 237, 0.5)");
  const computed = useMemo(() => {
    try {
      return { value: rgbaToHex(rgba.trim()), error: null as string | null };
    } catch (e) {
      return { value: "", error: (e as Error).message };
    }
  }, [rgba]);

  return (
    <div className="grid gap-4">
      <Field label="rgb() / rgba() value">
        <TextInput
          value={rgba}
          onChange={(e) => setRgba(e.target.value)}
          spellCheck={false}
          placeholder="rgba(255, 0, 0, 0.5)"
        />
      </Field>
      {computed.error ? (
        <p className="text-red-400 text-sm">{computed.error}</p>
      ) : (
        <>
          <div className="flex h-1 w-full overflow-hidden rounded-full" />
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-xl border border-border/60"
              style={{ backgroundColor: computed.value }}
            />
            <span className="font-mono text-sm text-foreground">
              {computed.value}
            </span>
          </div>
          <OutBox value={computed.value} mono />
        </>
      )}
    </div>
  );
}

function ShadesPanel() {
  const [base, setBase] = useState("#0ea5e9");
  const [steps, setSteps] = useState("9");
  const computed = useMemo(() => {
    try {
      return {
        colors: shadeScale(base.trim(), Number(steps)),
        error: null as string | null,
      };
    } catch (e) {
      return { colors: [] as string[], error: (e as Error).message };
    }
  }, [base, steps]);
  const n = Number(steps);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Base color">
          <TextInput
            value={base}
            onChange={(e) => setBase(e.target.value)}
            spellCheck={false}
            placeholder="#0ea5e9"
          />
        </Field>
        <Field label="Number of steps">
          <SelectInput
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            options={["7", "9", "11", "13"]}
            className="w-24"
          />
        </Field>
      </div>
      {computed.error ? (
        <p className="text-red-400 text-sm">{computed.error}</p>
      ) : (
        <>
          <div
            className="h-4 w-full overflow-hidden rounded-full"
            style={{
              background: `linear-gradient(to right, ${computed.colors.join(", ")})`,
            }}
          />
          <div
            className="grid gap-2 sm:grid-cols-3"
            style={{
              gridTemplateColumns: `repeat(${Math.min(n, 6)}, minmax(0, 1fr))`,
            }}
          >
            {computed.colors.map((c, i) => {
              const pct = Math.round((i / (n - 1)) * 100 - 50);
              return (
                <div key={c + i} className="grid gap-1.5">
                  <p className="text-center text-xs font-medium text-muted-foreground">
                    {pct > 0 ? `+${pct}` : pct}%
                  </p>
                  <Swatch hex={c} />
                  <p className="text-center font-mono text-xs text-muted-foreground">
                    {c}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function MixerPanel() {
  const [a, setA] = useState("#ff0000");
  const [b, setB] = useState("#0000ff");
  const [ratio, setRatio] = useState(50);
  const computed = useMemo(() => {
    try {
      return {
        value: mixColors(a.trim(), b.trim(), ratio / 100),
        error: null as string | null,
      };
    } catch (e) {
      return { value: "", error: (e as Error).message };
    }
  }, [a, b, ratio]);
  const ramp = useMemo(() => {
    try {
      return [0, 0.25, 0.5, 0.75, 1].map((r) =>
        mixColors(a.trim(), b.trim(), r),
      );
    } catch {
      return [] as string[];
    }
  }, [a, b]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Color A">
          <TextInput
            value={a}
            onChange={(e) => setA(e.target.value)}
            spellCheck={false}
            placeholder="#ff0000"
          />
        </Field>
        <Field label="Color B">
          <TextInput
            value={b}
            onChange={(e) => setB(e.target.value)}
            spellCheck={false}
            placeholder="#0000ff"
          />
        </Field>
      </div>
      <Field label={`Ratio B: ${ratio}%`}>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={ratio}
          onChange={(e) => setRatio(Number(e.target.value))}
          className="w-full accent-foreground"
        />
      </Field>
      {computed.error ? (
        <p className="text-red-400 text-sm">{computed.error}</p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-xl border border-border/60"
              style={{ backgroundColor: computed.value }}
            />
            <span className="font-mono text-sm text-foreground">
              {computed.value}
            </span>
          </div>
          <OutBox value={computed.value} mono />
          {ramp.length > 0 && (
            <div className="grid grid-cols-5 gap-2">
              {ramp.map((c, i) => (
                <div key={c + i} className="grid gap-1">
                  <Swatch hex={c} />
                  <p className="text-center text-xs text-muted-foreground">
                    {i * 25}%
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ColorTools({ tool }: ToolPageProps) {
  switch (tool.slug) {
    case "color-palette":
      return <PalettePanel />;
    case "hex-to-rgba":
      return <HexToRgbaPanel />;
    case "rgba-to-hex":
      return <RgbaToHexPanel />;
    case "color-shades":
      return <ShadesPanel />;
    case "color-mixer":
      return <MixerPanel />;
    default:
      return null;
  }
}
