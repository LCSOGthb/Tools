import { useState } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import { Field, TextArea, TextInput, NumInput, ToggleInput, PrimaryButton, Chip } from "@/components/tools/shared/fields";

export default function CodeToImage({ tool }: ToolPageProps) {
  const [code, setCode] = useState("");
  const [filename, setFilename] = useState("snippet.js");
  const [bg, setBg] = useState("#1e1e2e");
  const [text, setText] = useState("#cdd6f4");
  const [fontSize, setFontSize] = useState(14);
  const [padding, setPadding] = useState(24);
  const [chrome, setChrome] = useState(true);

  const lines = code === "" ? [""] : code.split("\n");
  const contentWidth = Math.max(80, Math.max(...lines.map((l) => l.length)) * fontSize * 0.6);
  const renderedHeight = lines.length * lineHeight(fontSize);
  const width = Math.round(contentWidth + padding * 2);
  const height = Math.round(renderedHeight + padding * 2 + (chrome ? 40 : 0));

  function lineHeight(fs: number) {
    return Math.round(fs * 1.5);
  }

  const download = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (chrome) {
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(0, 0, canvas.width, 40);
      const dotColors = ["#ff5f57", "#febc2e", "#28c840"];
      dotColors.forEach((c, i) => {
        ctx.beginPath();
        ctx.arc(20 + i * 18, 20, 6, 0, Math.PI * 2);
        ctx.fillStyle = c;
        ctx.fill();
      });
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = `${Math.round(fontSize * 0.8)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(filename || "snippet", canvas.width / 2, 25);
      ctx.textAlign = "left";
    }
    ctx.fillStyle = text;
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = "top";
    const startY = chrome ? 40 + padding : padding;
    lines.forEach((line, i) => {
      ctx.fillText(line.replace(/\t/g, "  "), padding, startY + i * lineHeight(fontSize));
    });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = (filename || "code").replace(/\.[^.]+$/, "") + ".png";
    a.click();
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Chip color="bg-ring/15 text-ring">{tool.slug}</Chip>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <Field label="Code" hint="Paste any code snippet">
          <TextArea value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} className="font-mono min-h-36" placeholder="const greeting = 'Hello, world!';" />
        </Field>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Filename"><TextInput value={filename} onChange={(e) => setFilename(e.target.value)} /></Field>
          <Field label="Background"><TextInput type="color" value={bg} onChange={(e) => setBg(e.target.value)} /></Field>
          <Field label="Text color"><TextInput type="color" value={text} onChange={(e) => setText(e.target.value)} /></Field>
          <Field label="Font size"><NumInput value={fontSize} min={8} max={48} onChange={(e) => setFontSize(Number(e.target.value) || 14)} /></Field>
          <Field label="Padding"><NumInput value={padding} min={0} max={80} onChange={(e) => setPadding(Number(e.target.value) || 0)} /></Field>
          <div className="self-end"><ToggleInput label="Window chrome" checked={chrome} onChange={setChrome} /></div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="overflow-hidden rounded-xl" style={{ backgroundColor: bg, padding }}>
          {chrome && (
            <div className="-mx-4 -mt-4 mb-4 flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 text-xs" style={{ color: text, opacity: 0.8 }}>{filename || "snippet"}</span>
            </div>
          )}
          <pre className="whitespace-pre font-mono" style={{ color: text, fontSize }}>{code || " "}</pre>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Estimated size: {width} × {height} px</p>
        <div className="mt-4">
          <PrimaryButton onClick={download} disabled={!code.trim()}>Download PNG</PrimaryButton>
        </div>
      </div>
    </div>
  );
}
