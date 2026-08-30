import { useState } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import { rnShadowStyle } from "@/lib/tools/coding";
import {
  Field,
  NumInput,
  TextInput,
  OutBox,
  Chip,
} from "@/components/tools/shared/fields";

const PRESETS = [1, 2, 3, 4, 5];

export default function RnShadow({ tool }: ToolPageProps) {
  const [depth, setDepth] = useState(3);
  const [color, setColor] = useState("#000000");
  const [iosOpacity, setIosOpacity] = useState(0.2);
  const [androidElevation, setAndroidElevation] = useState(4);
  const [spread, setSpread] = useState(0);

  const style = rnShadowStyle({
    depth,
    color,
    iosOpacity,
    androidElevation,
    spread,
  });

  const loadPreset = (d: number) => {
    setDepth(d);
    setAndroidElevation(d + 1);
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Chip color="bg-ring/15 text-ring">{tool.slug}</Chip>
        <span className="text-xs text-muted-foreground">Depth presets</span>
        {PRESETS.map((d) => (
          <button
            key={d}
            onClick={() => loadPreset(d)}
            className={`rounded-xl border px-3 py-1.5 text-sm transition ${depth === d ? "border-ring/60 bg-ring/10 text-foreground" : "border-border bg-background/60 text-muted-foreground hover:text-foreground"}`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Depth">
          <NumInput
            value={depth}
            min={1}
            max={20}
            onChange={(e) => setDepth(Number(e.target.value) || 1)}
          />
        </Field>
        <Field label="Color">
          <TextInput
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </Field>
        <Field label="iOS shadowOpacity (0–1)">
          <NumInput
            value={iosOpacity}
            min={0}
            max={1}
            step={0.05}
            onChange={(e) => setIosOpacity(Number(e.target.value) || 0)}
          />
        </Field>
        <Field label="Android elevation">
          <NumInput
            value={androidElevation}
            min={0}
            max={50}
            onChange={(e) => setAndroidElevation(Number(e.target.value) || 0)}
          />
        </Field>
        <Field label="Spread (optional)">
          <NumInput
            value={spread}
            min={0}
            max={50}
            onChange={(e) => setSpread(Number(e.target.value) || 0)}
          />
        </Field>
      </div>

      <OutBox value={style} mono filename="shadow-style.js" />

      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
          Depth previews
        </p>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
          {PRESETS.map((d) => (
            <button
              key={d}
              onClick={() => loadPreset(d)}
              className={`flex flex-col items-center rounded-xl border p-4 transition ${depth === d ? "border-ring/60 bg-ring/10" : "border-border bg-background/60 hover:border-ring/40"}`}
            >
              <div
                className={`h-10 w-10 rounded-lg bg-card`}
                style={{
                  boxShadow: `0 ${d}px ${d * 2 + 2}px rgba(0,0,0,${0.1 + d * 0.06})`,
                }}
              />
              <span className="mt-2 text-xs text-muted-foreground">{d}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
