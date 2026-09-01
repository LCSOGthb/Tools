import { useState } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import { formatJson, minifyJson, validateJson } from "@/lib/tools/coding";
import {
  Field,
  TextArea,
  SelectInput,
  PrimaryButton,
  OutBox,
  Chip,
} from "@/components/tools/shared/fields";

type Mode = "format" | "minify" | "validate";

export default function JsonFormatter({ tool }: ToolPageProps) {
  const [mode, setMode] = useState<Mode>("format");
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState("2");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<{
    valid: boolean;
    error?: string;
    line?: number;
  } | null>(null);

  const run = () => {
    setError(null);
    setValidation(null);
    if (!input.trim()) {
      setOutput("");
      return;
    }
    try {
      if (mode === "format") {
        setOutput(
          indent === "tab"
            ? JSON.stringify(JSON.parse(input), null, "\t")
            : formatJson(input, Number(indent)),
        );
      } else if (mode === "minify") {
        setOutput(minifyJson(input));
      }
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
    if (mode === "validate") {
      setValidation(validateJson(input));
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["format", "minify", "validate"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setValidation(null);
            }}
            className={`rounded-xl border px-4 py-2 text-sm capitalize transition ${
              mode === m
                ? "border-ring/60 bg-ring/10 text-foreground"
                : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {m}
          </button>
        ))}
        <Chip color="bg-ring/15 text-ring">{tool.slug}</Chip>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <Field label="Input JSON" hint="Paste JSON to transform or validate">
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder='{"key": "value"}'
          />
        </Field>
        {mode === "format" && (
          <div className="mt-3">
            <SelectInput
              value={indent}
              onChange={(e) => setIndent(e.target.value)}
              options={["2", "4", "tab"]}
            />
          </div>
        )}
        <div className="mt-4">
          <PrimaryButton onClick={run}>
            {mode === "format"
              ? "Format"
              : mode === "minify"
                ? "Minify"
                : "Validate"}
          </PrimaryButton>
        </div>
      </div>

      {mode === "validate" ? (
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          {validation === null ? (
            <p className="text-sm text-muted-foreground">
              Run validation to check your JSON.
            </p>
          ) : validation.valid ? (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              Valid JSON
            </div>
          ) : (
            <div className="text-red-400 text-sm">
              <p className="font-medium">Invalid JSON</p>
              {typeof validation.line === "number" && (
                <p className="mt-1">Line {validation.line}</p>
              )}
              {validation.error && (
                <p className="mt-1 break-words">{validation.error}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {error && <p className="text-red-400 text-sm">Error: {error}</p>}
          {output && <OutBox value={output} mono filename="output.json" />}
        </>
      )}
    </div>
  );
}
