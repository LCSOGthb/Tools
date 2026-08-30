import { useState, useMemo } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import { formatXml, minifyXml, validateXml, xmlToJson, jsonToXml } from "@/lib/tools/xml";
import { Field, TextInput, TextArea, SelectInput, ToggleInput, OutBox } from "@/components/tools/shared/fields";

const SAMPLE = `<root>
  <person id="1"><name>Ada</name></person>
  <person id="2"><name>Grace</name></person>
</root>`;

function FormatterPanel() {
  const [input, setInput] = useState(SAMPLE);
  const [indent, setIndent] = useState("2");
  const computed = useMemo(() => {
    try {
      return { value: formatXml(input, Number(indent)), error: null as string | null };
    } catch (e) {
      return { value: "", error: (e as Error).message };
    }
  }, [input, indent]);

  return (
    <div className="grid gap-4">
      <Field label="XML">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} className="font-mono" />
      </Field>
      <Field label="Indent size">
        <SelectInput value={indent} onChange={(e) => setIndent(e.target.value)} options={["2", "4"]} className="w-24" />
      </Field>
      {computed.error ? <p className="text-red-400 text-sm">{computed.error}</p> : <OutBox value={computed.value} mono downloadable filename="formatted.xml" />}
    </div>
  );
}

function MinifierPanel() {
  const [input, setInput] = useState(SAMPLE);
  const [keepComments, setKeepComments] = useState(false);
  const computed = useMemo(() => {
    try {
      return { value: minifyXml(input, keepComments), error: null as string | null };
    } catch (e) {
      return { value: "", error: (e as Error).message };
    }
  }, [input, keepComments]);

  return (
    <div className="grid gap-4">
      <Field label="XML">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} className="font-mono" />
      </Field>
      <ToggleInput label="Keep comments" checked={keepComments} onChange={setKeepComments} />
      {computed.error ? <p className="text-red-400 text-sm">{computed.error}</p> : <OutBox value={computed.value} mono downloadable filename="minified.xml" />}
    </div>
  );
}

function ValidatorPanel() {
  const [input, setInput] = useState(SAMPLE);
  const result = useMemo(() => validateXml(input), [input]);

  return (
    <div className="grid gap-4">
      <Field label="XML to validate">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} className="font-mono" />
      </Field>
      {result.valid ? (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">Valid XML</div>
      ) : (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          Invalid XML
          {result.line > 0 && <> at line {result.line}</>}
          {result.column > 0 && <>, column {result.column}</>}
          {result.error && <> — {result.error}</>}
        </div>
      )}
    </div>
  );
}

function ConverterPanel() {
  const [mode, setMode] = useState("XML → JSON");
  const [input, setInput] = useState(`<root>
  <item id="1">one</item>
  <item id="2">two</item>
</root>`);
  const [root, setRoot] = useState("root");
  const computed = useMemo(() => {
    try {
      return {
        value: mode === "XML → JSON" ? xmlToJson(input) : jsonToXml(input, root.trim() || "root"),
        error: null as string | null,
      };
    } catch (e) {
      return { value: "", error: (e as Error).message };
    }
  }, [mode, input, root]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Direction">
          <SelectInput value={mode} onChange={(e) => setMode(e.target.value)} options={["XML → JSON", "JSON → XML"]} />
        </Field>
        {mode === "JSON → XML" && (
          <Field label="Root element name">
            <TextInput value={root} onChange={(e) => setRoot(e.target.value)} spellCheck={false} placeholder="root" />
          </Field>
        )}
      </div>
      <Field label={mode === "XML → JSON" ? "XML" : "JSON"}>
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} className="font-mono" />
      </Field>
      {computed.error ? <p className="text-red-400 text-sm">{computed.error}</p> : <OutBox value={computed.value} mono downloadable filename={mode === "XML → JSON" ? "output.json" : "output.xml"} />}
      <p className="text-xs text-muted-foreground/70">Works for simple XML without mixed content or namespaces. Errors from either direction are shown inline.</p>
    </div>
  );
}

export default function XmlTools({ tool }: ToolPageProps) {
  switch (tool.slug) {
    case "xml-formatter":
      return <FormatterPanel />;
    case "xml-minifier":
      return <MinifierPanel />;
    case "xml-validator":
      return <ValidatorPanel />;
    case "xml-json-converter":
      return <ConverterPanel />;
    default:
      return null;
  }
}