import { useMemo, useState } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import { QRCodeSVG } from "qrcode.react";
import {
  Field,
  SelectInput,
  TextInput,
  OutBox,
} from "@/components/tools/shared/fields";

type Kind = "text" | "url" | "wifi" | "vcard";

const KINDS: { value: Kind; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "url", label: "URL" },
  { value: "wifi", label: "Wi-Fi" },
  { value: "vcard", label: "vCard" },
];

const START: Record<
  Exclude<Kind, "text">,
  { a: string; b: string; c: string }
> = {
  url: { a: "", b: "", c: "" },
  wifi: { a: "MyNetwork", b: "secret", c: "WPA" },
  vcard: { a: "Jane Doe", b: "+1 555 0100", c: "jane@example.com" },
};

export default function QrGeneratorPage({ tool }: ToolPageProps) {
  const [kind, setKind] = useState<Kind>("text");
  const [text, setText] = useState("");
  const [a, setA] = useState("https://example.com");
  const [b, setB] = useState("");
  const [c, setC] = useState("");
  const [size, setSize] = useState(220);
  const [fg, setFg] = useState("#0f172a");
  const [bg, setBg] = useState("#ffffff");

  const switchKind = (k: Kind) => {
    setKind(k);
    if (k === "text") {
      setText(a);
    } else {
      const start = START[k];
      setA(k === "url" ? text || "https://example.com" : start.a);
      setB(start.b);
      setC(start.c);
    }
  };

  const payload = useMemo(() => {
    switch (kind) {
      case "text":
        return text;
      case "url":
        return a.startsWith("http") ? a : `https://${a}`;
      case "wifi":
        return `WIFI:T:${c || "WPA"};S:${a};P:${b};;`;
      case "vcard":
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${a}\nTEL:${b}\nEMAIL:${c}\nEND:VCARD`;
    }
  }, [kind, text, a, b, c]);

  const copyPayload = () =>
    navigator.clipboard?.writeText(payload).catch(() => {});

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
        <Field label="Type">
          <SelectInput
            options={KINDS.map((k) => k.label)}
            value={KINDS.find((k) => k.value === kind)!.label}
            onChange={(e) =>
              switchKind(KINDS.find((k) => k.label === e.target.value)!.value)
            }
          />
        </Field>

        {kind === "text" && (
          <Field label="Text">
            <TextInput
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Whatever you want to encode…"
            />
          </Field>
        )}

        {kind === "url" && (
          <Field label="URL" hint="http:// prefix added automatically">
            <TextInput
              value={a}
              onChange={(e) => setA(e.target.value)}
              placeholder="example.com"
            />
          </Field>
        )}

        {kind === "wifi" && (
          <>
            <Field label="Network (SSID)">
              <TextInput value={a} onChange={(e) => setA(e.target.value)} />
            </Field>
            <Field label="Password">
              <TextInput value={b} onChange={(e) => setB(e.target.value)} />
            </Field>
            <Field label="Security">
              <SelectInput
                options={["WPA", "WEP", "nopass"]}
                value={c}
                onChange={(e) => setC(e.target.value)}
              />
            </Field>
          </>
        )}

        {kind === "vcard" && (
          <>
            <Field label="Name (FN)">
              <TextInput value={a} onChange={(e) => setA(e.target.value)} />
            </Field>
            <Field label="Phone (TEL)">
              <TextInput value={b} onChange={(e) => setB(e.target.value)} />
            </Field>
            <Field label="Email (EMAIL)">
              <TextInput value={c} onChange={(e) => setC(e.target.value)} />
            </Field>
          </>
        )}

        <Field label={`Size: ${size}px`}>
          <input
            type="range"
            min={128}
            max={512}
            step={8}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full accent-cyan-400"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Foreground">
            <input
              type="color"
              value={fg}
              onChange={(e) => setFg(e.target.value)}
              className="h-10 w-full cursor-pointer rounded-xl border border-border bg-background/80"
            />
          </Field>
          <Field label="Background">
            <input
              type="color"
              value={bg}
              onChange={(e) => setBg(e.target.value)}
              className="h-10 w-full cursor-pointer rounded-xl border border-border bg-background/80"
            />
          </Field>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-white p-6">
          <QRCodeSVG
            value={payload}
            size={size}
            bgColor={bg}
            fgColor={fg}
            level="M"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
              Encoded payload
            </span>
            <button
              onClick={copyPayload}
              className="text-xs text-cyan-400 transition hover:text-cyan-300"
            >
              Copy
            </button>
          </div>
          <OutBox value={payload} />
        </div>
      </div>
    </div>
  );
}
