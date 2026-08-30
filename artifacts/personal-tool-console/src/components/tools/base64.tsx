import { useState } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import { base64Encode, base64Decode } from "@/lib/tools/base64";
import { Field, TextArea, SelectInput, OutBox, Chip } from "@/components/tools/shared/fields";

export default function Base64({ tool }: ToolPageProps) {
  const [mode, setMode] = useState("Encode");
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const transform = () => {
    if (!input) return "";
    try {
      setError(null);
      return mode === "Encode" ? base64Encode(input) : base64Decode(input);
    } catch (e) {
      setError((e as Error).message);
      return "";
    }
  };

  const output = transform();

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SelectInput value={mode} onChange={(e) => { setMode(e.target.value); setError(null); }} options={["Encode", "Decode"]} className="w-36" />
        <Chip color="bg-ring/15 text-ring">{tool.slug}</Chip>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <Field label={mode === "Encode" ? "Plain text" : "Base64 string"}>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder={mode === "Encode" ? "Hello, world!" : "SGVsbG8sIHdvcmxkIQ=="}
          />
        </Field>
      </div>

      {output && (
        <>
          <div className="rounded-2xl border border-border bg-card/60 p-4">
            <p className="text-sm text-muted-foreground">input {input.length} chars → output {output.length} chars</p>
          </div>
          <OutBox value={output} mono filename={mode === "Encode" ? "encoded.txt" : "decoded.txt"} />
        </>
      )}
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}
