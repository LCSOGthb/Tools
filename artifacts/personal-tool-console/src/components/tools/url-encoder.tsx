import { useState } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import { urlEncode, urlDecode } from "@/lib/tools/coding";
import { Field, TextArea, SelectInput, OutBox, Chip } from "@/components/tools/shared/fields";

export default function UrlEncoder({ tool }: ToolPageProps) {
  const [mode, setMode] = useState("Encode");
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const transform = () => {
    if (!input) return "";
    try {
      setError(null);
      return mode === "Encode" ? urlEncode(input) : urlDecode(input);
    } catch (e) {
      setError((e as Error).message);
      return "";
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SelectInput value={mode} onChange={(e) => { setMode(e.target.value); setError(null); }} options={["Encode", "Decode"]} className="w-36" />
        <Chip color="bg-ring/15 text-ring">{tool.slug}</Chip>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <Field label={mode === "Encode" ? "Plain text" : "URL-encoded text"}>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder={mode === "Encode" ? "https://example.com?q=hello world 🚀" : "https%3A%2F%2Fexample.com%3Fq%3Dhello%20world"}
          />
        </Field>
      </div>

      {error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : (
        transform() !== "" && <OutBox value={transform()} mono filename={mode === "Encode" ? "encoded.txt" : "decoded.txt"} />
      )}
    </div>
  );
}
