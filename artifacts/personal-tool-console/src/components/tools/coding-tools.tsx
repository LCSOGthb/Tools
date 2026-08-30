import { useMemo, useState } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import { minifyJson, validateJson, slugify, htmlEncode, htmlDecode, formatHtml, minifyHtml, formatCss, minifyCss, minifyJs, md5 } from "@/lib/tools/coding";
import { Field, TextArea, SelectInput, OutBox, Chip, ToggleInput } from "@/components/tools/shared/fields";

function TextTransformer({ placeholder, transform, label, hint, chip }: {
  placeholder: string;
  transform: (s: string) => string;
  label: string;
  hint?: string;
  chip?: string;
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    try {
      setError(null);
      return transform(input);
    } catch (e) {
      setError((e as Error).message);
      return "";
    }
  }, [input, transform]);

  return (
    <div className="grid gap-4">
      {chip && (
        <div className="flex items-center gap-2">
          <Chip color="bg-ring/15 text-ring">{chip}</Chip>
        </div>
      )}
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <Field label={label} hint={hint}>
          <TextArea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} className="font-mono" placeholder={placeholder} />
        </Field>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {output !== "" && <OutBox value={output} mono filename="output.txt" />}
    </div>
  );
}

function formatJsCode(code: string): string {
  const indentUnit = "  ";
  let indent = 0;
  const out: string[] = [];
  let i = 0;
  let lineStart = true;
  let pending = "";

  const push = (s: string) => {
    for (const ch of s) {
      if (lineStart && ch !== " " && ch !== "\t") {
        out.push(indentUnit.repeat(indent));
        lineStart = false;
      }
      out.push(ch);
      if (ch === "\n") lineStart = true;
    }
  };

  while (i < code.length) {
    const ch = code[i];
    const next = code[i + 1];

    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      push(ch);
      i++;
      while (i < code.length) {
        const c = code[i];
        push(c);
        if (c === "\\") {
          if (i + 1 < code.length) { push(code[i + 1]); i++; }
          i++;
          continue;
        }
        if (c === quote) { i++; break; }
        if (c === "\n" && quote !== "`") break;
        i++;
      }
      continue;
    }

    if (ch === "/" && next === "/") {
      while (i < code.length && code[i] !== "\n") { push(code[i]); i++; }
      continue;
    }

    if (ch === "/" && next === "*") {
      push("/*");
      i += 2;
      while (i < code.length && !(code[i] === "*" && code[i + 1] === "/")) { push(code[i]); i++; }
      if (i < code.length) { push("*/"); i += 2; }
      continue;
    }

    if (ch === "{") {
      push("{");
      indent++;
      push("\n");
      i++;
      continue;
    }
    if (ch === "}") {
      indent = Math.max(0, indent - 1);
      push("\n");
      push("}");
      i++;
      continue;
    }
    if (ch === "(" || ch === "[") {
      push(ch);
      indent++;
      push("\n");
      i++;
      continue;
    }
    if (ch === ")" || ch === "]") {
      indent = Math.max(0, indent - 1);
      push("\n");
      push(ch);
      i++;
      continue;
    }
    if (ch === ";") {
      push(ch);
      push("\n");
      i++;
      continue;
    }
    if (ch === ",") {
      push(ch);
      push("\n");
      i++;
      continue;
    }
    if (ch === "\r") {
      i++;
      continue;
    }

    push(ch);
    i++;
  }

  return out.join("");
}

function JsonMinifier() {
  return <TextTransformer chip="json-minifier" label="JSON input" placeholder='{"key": "value"}' transform={minifyJson} />;
}

function JsonValidator() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{ valid: boolean; error?: string; line?: number } | null>(null);

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2">
        <Chip color="bg-ring/15 text-ring">json-validator</Chip>
      </div>
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <Field label="JSON input">
          <TextArea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} className="font-mono" placeholder='{"key": "value"}' />
        </Field>
        <div className="mt-4">
          <button
            onClick={() => setResult(input.trim() ? validateJson(input) : null)}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Validate
          </button>
        </div>
      </div>
      {result && (
        result.valid ? (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">Valid JSON</div>
        ) : (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <p className="font-medium">Invalid JSON</p>
            {typeof result.line === "number" && <p className="mt-1">At line {result.line}</p>}
            {result.error && <p className="mt-1 break-words">{result.error}</p>}
          </div>
        )
      )}
    </div>
  );
}

function UrlSlug() {
  return <TextTransformer chip="url-slug" label="Text input" placeholder="Hello World — Clean & Tidy!" transform={slugify} />;
}

function HtmlEncoder() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Chip color="bg-ring/15 text-ring">html-encoder</Chip>
        <div className="w-64"><ToggleInput label="Decode mode" checked={mode === "decode"} onChange={(v) => setMode(v ? "decode" : "encode")} /></div>
      </div>
      <TextTransformer
        chip=""
        label={mode === "encode" ? "HTML text" : "Encoded entities"}
        placeholder={mode === "encode" ? "<div>Hello & welcome</div>" : "&lt;div&gt;Hello &amp; welcome&lt;/div&gt;"}
        transform={mode === "encode" ? htmlEncode : htmlDecode}
      />
    </div>
  );
}

function HtmlFormatter() {
  const [indent, setIndent] = useState("2");
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2">
        <Chip color="bg-ring/15 text-ring">html-formatter</Chip>
      </div>
      <TextTransformer
        chip=""
        label="HTML input"
        placeholder="<div><p>Hello</p></div>"
        transform={(s) => formatHtml(s).split("\n").map((l) => (indent === "4" ? l.replace(/^(  )/g, "    ") : l)).join("\n")}
      />
      <div className="w-36">
        <SelectInput value={indent} onChange={(e) => setIndent(e.target.value)} options={["2", "4"]} />
      </div>
    </div>
  );
}

function HtmlMinifier() {
  return <TextTransformer chip="html-minifier" label="HTML input" placeholder="<div>  <p>Hello</p>  </div>" transform={minifyHtml} />;
}

function CssFormatter() {
  return <TextTransformer chip="css-formatter" label="CSS input" placeholder="a{color:red;margin:0}" transform={formatCss} />;
}

function CssMinifier() {
  return <TextTransformer chip="css-minifier" label="CSS input" placeholder="a { color: red; margin: 0; }" transform={minifyCss} />;
}

function JsFormatter() {
  return <TextTransformer chip="js-formatter" label="JavaScript input" placeholder="function add(a,b){return a+b;}" transform={formatJsCode} />;
}

function JsMinifier() {
  return <TextTransformer chip="js-minifier" label="JavaScript input" placeholder="function add(a, b) { return a + b; }" transform={minifyJs} />;
}

function Md5Hash() {
  return <TextTransformer chip="md5-hash" label="Input text" placeholder="hello" transform={md5} />;
}

export default function CodingTools({ tool }: ToolPageProps) {
  switch (tool.slug) {
    case "json-minifier": return <JsonMinifier />;
    case "json-validator": return <JsonValidator />;
    case "url-slug": return <UrlSlug />;
    case "html-encoder": return <HtmlEncoder />;
    case "html-formatter": return <HtmlFormatter />;
    case "html-minifier": return <HtmlMinifier />;
    case "css-formatter": return <CssFormatter />;
    case "css-minifier": return <CssMinifier />;
    case "js-formatter": return <JsFormatter />;
    case "js-minifier": return <JsMinifier />;
    case "md5-hash": return <Md5Hash />;
    default: return <div className="text-sm text-muted-foreground">Unknown tool</div>;
  }
}
