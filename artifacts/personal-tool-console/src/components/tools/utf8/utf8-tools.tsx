import { useState, useMemo } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import {
  textToUtf8Bytes,
  utf8BytesToText,
  textToCodepoints,
  validateUtf8,
  addBom,
  removeBom,
  detectBom,
  escapeSequences,
  unescapeSequences,
} from "@/lib/tools/utf8";
import { Field, TextArea, SelectInput, ToggleInput, OutBox, GhostButton, Chip } from "@/components/tools/shared/fields";

function EncoderPanel() {
  const [decodeMode, setDecodeMode] = useState(false);
  const [text, setText] = useState("Hello, 世界!");
  const bytes = useMemo(() => textToUtf8Bytes(text), [text]);
  const decoded = useMemo(() => {
    try {
      const vals = text.trim().split(/[\s,]+/).map((h) => parseInt(h, 16));
      if (vals.length === 0 || vals.some((v) => Number.isNaN(v))) {
        return { value: "", error: "Enter hex bytes separated by spaces or commas" };
      }
      return { value: utf8BytesToText(vals), error: null as string | null };
    } catch (e) {
      return { value: "", error: (e as Error).message };
    }
  }, [text]);

  return (
    <div className="grid gap-4">
      <ToggleInput label="Decode bytes → text" checked={decodeMode} onChange={setDecodeMode} />
      <Field label={decodeMode ? "Hex bytes" : "Text"}>
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          className="font-mono"
          placeholder={decodeMode ? "48 65 6c 6c 6f 20 2c 20 e4 b8 96 e7 95 8c 21" : "Hello, 世界!"}
        />
      </Field>
      {decodeMode ? (
        <>
          {decoded.error ? <p className="text-red-400 text-sm">{decoded.error}</p> : <OutBox value={decoded.value} mono={false} />}
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{bytes.length} bytes total</p>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card/60 p-2">
            <table className="w-full text-left font-mono text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">offset</th>
                  <th className="px-3 py-2">hex</th>
                  <th className="px-3 py-2">dec</th>
                  <th className="px-3 py-2">binary</th>
                </tr>
              </thead>
              <tbody>
                {bytes.map((b) => (
                  <tr key={b.offset} className="odd:bg-background/30">
                    <td className="px-3 py-1.5 text-muted-foreground">{b.offset}</td>
                    <td className="px-3 py-1.5 text-ring">{b.hex}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{b.dec}</td>
                    <td className="px-3 py-1.5 text-foreground">{b.binary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function CodepointPanel() {
  const [text, setText] = useState("A 😀");
  const rows = useMemo(() => textToCodepoints(text), [text]);

  return (
    <div className="grid gap-4">
      <Field label="Text">
        <TextArea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} placeholder="A 😀 — try mixed scripts" />
      </Field>
      <p className="text-sm text-muted-foreground">{rows.length} codepoint{rows.length === 1 ? "" : "s"}</p>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card/60 p-2">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2">char</th>
              <th className="px-3 py-2">codepoint</th>
              <th className="px-3 py-2">utf-8</th>
              <th className="px-3 py-2">html</th>
              <th className="px-3 py-2">js escape</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.codepoint + r.char} className="odd:bg-background/30">
                <td className="px-3 py-1.5 font-mono text-foreground">{r.char === " " ? "␣" : r.char}</td>
                <td className="px-3 py-1.5 font-mono text-ring">{r.hex}</td>
                <td className="px-3 py-1.5 font-mono text-foreground">{r.utf8 || "—"}</td>
                <td className="px-3 py-1.5 font-mono text-muted-foreground">{r.html}</td>
                <td className="px-3 py-1.5 font-mono text-muted-foreground">{r.js}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ValidatorPanel() {
  const [text, setText] = useState("Hello, 世界!");
  const result = useMemo(() => {
    const mode = /^(?:[0-9a-fA-F]{2}\s*)+$/.test(text.trim()) ? "hex bytes" : "text";
    try {
      const r = validateUtf8(text);
      const problem = r && r.problems && r.problems[0] ? r.problems[0] : null;
      return { mode, valid: Boolean(r && r.valid), problem };
    } catch (e) {
      return { mode, valid: false, problem: null };
    }
  }, [text]);
  const first = result.problem;

  return (
    <div className="grid gap-4">
      <Field label="Decode text or hex bytes">
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          className="font-mono"
          placeholder={"Hello, 世界!  or  F0 9F 98 80"}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <Chip color="bg-ring/15 text-ring">interpreting as {result.mode}</Chip>
        {result.valid ? (
          <Chip color="bg-green-500/15 text-green-400">VALID</Chip>
        ) : (
          <Chip color="bg-red-500/15 text-red-400">INVALID</Chip>
        )}
      </div>
      {!result.valid && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {first ? `${first.reason} at byte offset ${first.offset}` : "Invalid UTF-8 byte sequence detected"}
        </div>
      )}
    </div>
  );
}

function BomPanel() {
  const [text, setText] = useState("");
  const hasBom = detectBom(text);
  const hex3 = Array.from(new TextEncoder().encode(text).slice(0, 3))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");

  return (
    <div className="grid gap-4">
      <Field label="Text">
        <TextArea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} placeholder="Text to tag with a BOM" />
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <GhostButton type="button" onClick={() => setText(addBom(text))}>Add BOM</GhostButton>
        <GhostButton type="button" onClick={() => setText(removeBom(text))}>Strip BOM</GhostButton>
        <Chip color={hasBom ? "bg-green-500/15 text-green-400" : "bg-border/60 text-muted-foreground"}>
          {hasBom ? "BOM present" : "no BOM"}
        </Chip>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">first 3 bytes:</span>
        <span className="font-mono text-foreground">{hex3 || "(empty)"}</span>
        {hasBom && <span className="text-xs text-muted-foreground/70">EF BB BF proves the BOM is there</span>}
      </div>
    </div>
  );
}

function EscapePanel() {
  const [helper, setHelper] = useState('He said "hi" 😀\nnext line');
  const [mode, setMode] = useState("unicode");
  const [reverse, setReverse] = useState("\\u{1F600}");
  const encoded = useMemo(() => escapeSequences(helper, mode as "unicode" | "hex" | "raw"), [helper, mode]);
  const decoded = useMemo(() => {
    try {
      return { value: unescapeSequences(reverse), error: null as string | null };
    } catch (e) {
      return { value: "", error: (e as Error).message };
    }
  }, [reverse]);

  return (
    <div className="grid space-y-4">
      <div className="grid gap-4">
        <Field label="Source text">
          <TextArea value={helper} onChange={(e) => setHelper(e.target.value)} spellCheck={false} className="font-mono" />
        </Field>
        <Field label="Escape style">
          <SelectInput value={mode} onChange={(e) => setMode(e.target.value)} options={["unicode", "hex", "raw"]} className="w-36" />
        </Field>
        <div className="space-y-1.5">
          <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground/70">Escaped</span>
          <OutBox value={encoded} mono />
        </div>
      </div>
      <div className="border-t border-border" />
      <div className="grid gap-4">
        <Field label="Escaped input to unescape">
          <TextArea value={reverse} onChange={(e) => setReverse(e.target.value)} spellCheck={false} className="font-mono" />
        </Field>
        <div className="space-y-1.5">
          <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground/70">Unescaped</span>
          {decoded.error ? <p className="text-red-400 text-sm">{decoded.error}</p> : <OutBox value={decoded.value} mono={false} />}
        </div>
      </div>
    </div>
  );
}

export default function Utf8Tools({ tool }: ToolPageProps) {
  switch (tool.slug) {
    case "utf8-encoder":
      return <EncoderPanel />;
    case "codepoint-inspector":
      return <CodepointPanel />;
    case "utf8-validator":
      return <ValidatorPanel />;
    case "bom-utilities":
      return <BomPanel />;
    case "escape-sequences":
      return <EscapePanel />;
    default:
      return null;
  }
}