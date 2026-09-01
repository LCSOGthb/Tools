import { useMemo, useState } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import { uuidBulk } from "@/lib/tools/coding";
import {
  Field,
  SelectInput,
  NumInput,
  OutBox,
  PrimaryButton,
  ToggleInput,
} from "@/components/tools/shared/fields";

type Version = "v4" | "v7";

function uuidv7(uppercase: boolean): string {
  const bytes = new Uint8Array(16);
  const ms = Date.now();
  const view = new DataView(bytes.buffer);
  view.setUint32(0, Math.floor(ms / 0x100000000));
  view.setUint32(4, ms >>> 0);
  crypto.getRandomValues(bytes.subarray(8, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = Array.from(bytes, (x) => x.toString(16).padStart(2, "0")).join("");
  const out = `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  return uppercase ? out.toUpperCase() : out;
}

export default function UuidGeneratorPage({ tool }: ToolPageProps) {
  const [version, setVersion] = useState<Version>("v4");
  const [count, setCount] = useState(5);
  const [uppercase, setUppercase] = useState(false);

  const generate = (): string[] => {
    if (version === "v4") return uuidBulk(count, uppercase);
    return Array.from({ length: count }, () => uuidv7(uppercase));
  };

  const list = useMemo(generate, [version, count, uppercase]);
  const output = list.join("\n");

  const copyAll = () => navigator.clipboard?.writeText(output).catch(() => {});

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
        <Field label="Version">
          <SelectInput
            options={["v4", "v1 (not client-side)", "v7"]}
            value={version === "v4" ? "v4" : "v7"}
            onChange={(e) =>
              setVersion(
                e.target.value === "v1 (not client-side)"
                  ? version
                  : (e.target.value as Version),
              )
            }
          />
        </Field>
        <Field label="Count">
          <NumInput
            min={1}
            max={100}
            value={count}
            onChange={(e) =>
              setCount(Math.min(100, Math.max(1, Number(e.target.value) || 1)))
            }
          />
        </Field>
        <ToggleInput
          label="Uppercase"
          checked={uppercase}
          onChange={setUppercase}
        />
        <ToggleInput
          label="Lowercase (inverse of uppercase)"
          checked={!uppercase}
          onChange={(v) => setUppercase(!v)}
        />
        <p className="text-xs text-muted-foreground/60">
          v1 is not generated client-side (no MAC/timestamp source).
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
            {count} UUID{count === 1 ? "" : "s"} · v{version}
          </span>
          <PrimaryButton onClick={copyAll}>Copy all</PrimaryButton>
        </div>
        <OutBox
          value={output}
          className="min-h-64"
          downloadable
          filename={`uuids-${version}.txt`}
        />
      </div>
    </div>
  );
}
