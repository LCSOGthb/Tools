import { useEffect, useMemo, useState } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import { getTextTool, type TextOpts, type TextOpt } from "@/lib/tools/text";
import {
  TextArea,
  OutBox,
  Field,
  TextInput,
  NumInput,
  SelectInput,
  ToggleInput,
  PrimaryButton,
  GhostButton,
} from "@/components/tools/shared/fields";
import { WandSparkles, RotateCcw } from "lucide-react";

const DEFAULT_OPTS: TextOpts = {};

export default function TextToolPage({ tool }: ToolPageProps) {
  const spec = getTextTool(tool.slug);
  const [input, setInput] = useState("");
  const [opts, setOpts] = useState<TextOpts>(DEFAULT_OPTS);
  const [ran, setRan] = useState(false);

  useEffect(() => {
    setInput("");
    setOpts(DEFAULT_OPTS);
    setRan(false);
  }, [tool.slug]);

  const options = spec?.options ?? [];
  const result = useMemo(() => {
    if (!spec) return "";
    try {
      return spec.run(input, opts);
    } catch (e) {
      return `Error: ${(e as Error).message}`;
    }
  }, [spec, input, opts]);

  if (!spec) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        Tool definition not found in the text engine.
      </div>
    );
  }

  const setOpt = (k: string, v: string | number | boolean) =>
    setOpts((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
          <Field label="Input">
            <TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste or type your text here…"
              spellCheck={false}
              rows={9}
            />
          </Field>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
              Options
            </span>
            {options.length > 0 && (
              <GhostButton
                className="px-2.5 py-1.5 text-xs"
                onClick={() => setOpts(DEFAULT_OPTS)}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </GhostButton>
            )}
          </div>
          {options.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-black/30 p-3 text-xs text-muted-foreground">
              No options — the tool runs straight on the input.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {options.map((o) => (
                <OptionControl
                  key={o.key}
                  opt={o}
                  value={opts[o.key]}
                  onChange={(v) => setOpt(o.key, v)}
                />
              ))}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <PrimaryButton
              onClick={() => setRan(true)}
              disabled={input.trim().length === 0}
            >
              <WandSparkles className="h-4 w-4" /> Run
            </PrimaryButton>
            <div className="flex flex-1 items-end justify-end gap-4 text-xs text-muted-foreground">
              <span>{input.length.toLocaleString()} chars</span>
              <span>
                {input.trim()
                  ? input.trim().split(/\s+/).length.toLocaleString()
                  : 0}{" "}
                words
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
            Output
          </span>
        </div>
        <OutBox
          value={ran || input !== "" ? result : ""}
          className="min-h-28"
          downloadable
        />
        {!ran && input === "" && (
          <p className="text-xs text-muted-foreground/60">
            Type some input and press Run to see the result.
          </p>
        )}
      </div>
    </div>
  );
}

function OptionControl({
  opt,
  value,
  onChange,
}: {
  opt: TextOpt;
  value: string | number | boolean | undefined;
  onChange: (v: string | number | boolean) => void;
}) {
  if (opt.kind === "toggle") {
    return (
      <ToggleInput
        label={opt.label}
        checked={Boolean(value ?? opt.default ?? false)}
        onChange={onChange}
      />
    );
  }
  if (opt.kind === "number") {
    return (
      <Field label={opt.label}>
        <NumInput
          min={opt.min}
          max={opt.max}
          step={opt.step}
          value={Number(value ?? opt.default ?? 1)}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </Field>
    );
  }
  if (opt.kind === "select") {
    return (
      <Field label={opt.label}>
        <SelectInput
          options={opt.options}
          value={String(value ?? opt.default ?? opt.options[0])}
          onChange={(e) => onChange(e.target.value)}
        />
      </Field>
    );
  }
  return (
    <Field label={opt.label} className="sm:col-span-2">
      <TextInput
        value={String(value ?? opt.default ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder={opt.placeholder}
      />
    </Field>
  );
}
