import { useMemo, useState } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import {
  timestampNow,
  timestampFromUnix,
  timestampFromDate,
} from "@/lib/tools/timestamp";
import { Field, TextInput, OutBox } from "@/components/tools/shared/fields";

type Mode = "now" | "unix" | "date";

const MODES: { value: Mode; label: string }[] = [
  { value: "now", label: "Now" },
  { value: "unix", label: "Unix → Date" },
  { value: "date", label: "Date → Unix" },
];

const FIELDS: {
  key: "unix" | "unixMs" | "iso" | "utc" | "local";
  label: string;
}[] = [
  { key: "unix", label: "Unix (s)" },
  { key: "unixMs", label: "Unix (ms)" },
  { key: "iso", label: "ISO 8601" },
  { key: "utc", label: "UTC" },
  { key: "local", label: "Local" },
];

export default function TimestampPage({ tool }: ToolPageProps) {
  const [mode, setMode] = useState<Mode>("now");
  const [input, setInput] = useState("");

  const result = useMemo(() => {
    try {
      if (mode === "now") return { ok: true as const, data: timestampNow() };
      if (mode === "unix")
        return { ok: true as const, data: timestampFromUnix(input) };
      return { ok: true as const, data: timestampFromDate(input) };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [mode, input]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`rounded-xl border px-3.5 py-2.5 text-sm transition ${mode === m.value ? "border-ring/60 bg-ring/10 text-foreground" : "border-border bg-background/80 text-muted-foreground hover:text-foreground"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {mode !== "now" && (
          <div className="mt-3">
            <Field
              label={mode === "unix" ? "Unix timestamp" : "Date"}
              hint={
                mode === "unix"
                  ? "Seconds or milliseconds (≤ 13 digits)"
                  : "e.g. 2024-01-15 or 2024-01-15T10:30:00"
              }
            >
              <TextInput
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  mode === "unix" ? "1700000000" : "2024-01-15T10:30:00"
                }
              />
            </Field>
          </div>
        )}
      </div>

      {!result.ok ? (
        <p className="rounded-2xl border border-border bg-red-500/10 p-4 text-sm text-red-400">
          {result.error}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div
              key={f.key}
              className="rounded-2xl border border-border bg-card/60 p-4"
            >
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
                {f.label}
              </div>
              <OutBox
                value={String(result.data[f.key])}
                mono={f.key !== "local"}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
