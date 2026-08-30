import { useEffect, useRef, useState } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import { shuffleList, code39Encode, ean13, fakeIban, validateIbanFormat } from "@/lib/tools/misc";
import {
  Field, TextInput, NumInput, SelectInput, TextArea, OutBox, PrimaryButton, GhostButton, Chip,
} from "@/components/tools/shared/fields";

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ListRandomizer() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState("Shuffle all");
  const [countN, setCountN] = useState("1");
  const [seed, setSeed] = useState("");
  const [output, setOutput] = useState("");
  const items = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const run = () => {
    if (!items.length) { setOutput(""); return; }
    const rng = seed !== "" ? mulberry32(Number(seed) || 0) : null;
    if (mode === "Shuffle all") {
      setOutput(rng ? seededShuffle(items, rng).join("\n") : shuffleList(text));
    } else if (mode === "Pick 1") {
      const i = rng ? Math.floor(rng() * items.length) : Math.floor(Math.random() * items.length);
      setOutput(items[i]);
    } else {
      const n = Math.max(0, Number(countN) || 1);
      const pool = rng ? seededShuffle(items, rng) : [...items].sort(() => Math.random() - 0.5);
      setOutput(pool.slice(0, n).join("\n"));
    }
  };
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 rounded-2xl border border-border bg-card/60 p-4">
        <Field label="List (one item per line)">
          <TextArea value={text} onChange={(e) => setText(e.target.value)} placeholder={"apple\nbanana\ncherry"} spellCheck={false} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Mode"><SelectInput value={mode} onChange={(e) => setMode(e.target.value)} options={["Shuffle all", "Pick 1", "Pick N"]} /></Field>
          {mode === "Pick N" && <Field label="N"><NumInput min={1} value={countN} onChange={(e) => setCountN(e.target.value)} /></Field>}
          <Field label="Seed (optional)"><TextInput value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="e.g. 42" /></Field>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PrimaryButton onClick={run}>{mode === "Pick 1" ? "Pick" : "Run"}</PrimaryButton>
          <Chip color="bg-ring/15 text-ring">{items.length} item{items.length === 1 ? "" : "s"}</Chip>
        </div>
      </div>
      {output && <OutBox value={output} filename="randomized.txt" />}
    </div>
  );
}

const IBAN_CODES = ["AE", "BE", "CH", "DE", "ES", "FR", "GB", "IT", "NL", "SG", "SE", "US"];

function FakeIbanGen() {
  const [country, setCountry] = useState("DE");
  const [seed, setSeed] = useState("1");
  const [iban, setIban] = useState("");
  const [valid, setValid] = useState<boolean | null>(null);
  const generate = () => {
    const s = Number(seed) || 1;
    setIban(fakeIban(country, s));
    setValid(null);
  };
  const raw = iban.replace(/\s+/g, "");
  const check = () => setValid(validateIbanFormat(iban));
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 rounded-2xl border border-border bg-card/60 p-4 sm:grid-cols-3">
        <Field label="Country"><SelectInput value={country} onChange={(e) => setCountry(e.target.value)} options={IBAN_CODES} /></Field>
        <Field label="Seed"><NumInput value={seed} onChange={(e) => setSeed(e.target.value)} /></Field>
        <div className="flex items-end gap-2">
          <PrimaryButton onClick={generate}>Generate</PrimaryButton>
          {iban && <GhostButton onClick={generate}>Regenerate</GhostButton>}
        </div>
      </div>
      {iban && (
        <div className="grid gap-4">
          <div className="grid gap-3 rounded-2xl border border-border bg-card/60 p-4">
            <Field label="Formatted IBAN"><OutBox value={iban} filename="iban.txt" /></Field>
            <Field label="Raw (no spaces)"><OutBox value={raw} filename="iban-raw.txt" /></Field>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-4">
            <GhostButton onClick={check}>Validate format</GhostButton>
            {valid !== null && (
              <Chip color={valid ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}>
                {valid ? "Valid IBAN structure" : "Invalid IBAN"}
              </Chip>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BarcodeGen() {
  const [type, setType] = useState("Code 39");
  const [text, setText] = useState("HELLO");
  const [result, setResult] = useState<{ svg: string; width: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const generate = () => {
    setError(null);
    setResult(null);
    try {
      if (type === "Code 39") {
        const r = code39Encode(text);
        if (!r.valid) { setError(r.error ?? "Invalid input"); return; }
        setResult({ svg: r.svg, width: r.width });
      } else {
        const r = ean13(text);
        if (!r.valid) { setError(r.error ?? "Invalid input"); return; }
        setResult({ svg: r.svg, width: r.width });
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const download = () => {
    if (!result) return;
    const blob = new Blob([result.svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type.toLowerCase().replace(" ", "-")}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 rounded-2xl border border-border bg-card/60 p-4 sm:grid-cols-2">
        <Field label="Type"><SelectInput value={type} onChange={(e) => setType(e.target.value)} options={["Code 39", "EAN-13"]} /></Field>
        <Field label={type === "Code 39" ? "Text (A–Z, 0–9, space, - . $ / + %)" : "Digits (12 or 13)"}>
          <TextInput value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
        </Field>
        <div className="flex items-end gap-2">
          <PrimaryButton onClick={generate}>Generate</PrimaryButton>
          {result && <GhostButton onClick={download}>Download SVG</GhostButton>}
        </div>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {result && (
        <div className="grid gap-3 rounded-2xl border border-border bg-card/60 p-4">
          <div className="flex justify-center overflow-x-auto rounded-xl bg-white p-4">
            <div dangerouslySetInnerHTML={{ __html: result.svg }} />
          </div>
          <div className="flex items-center justify-center">
            <Chip color="bg-ring/15 text-ring">Width: {result.width} px</Chip>
          </div>
        </div>
      )}
    </div>
  );
}

function UnicodeRain() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [charset, setCharset] = useState("アカサタナハマヤラワ0123456789京阪神東海道物語");
  const [speed, setSpeed] = useState(1);
  const [color, setColor] = useState("#22d3ee");
  const [playing, setPlaying] = useState(true);
  const charsetRef = useRef(charset);
  const speedRef = useRef(speed);
  const colorRef = useRef(color);
  const playingRef = useRef(playing);
  useEffect(() => { charsetRef.current = charset; }, [charset]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { playingRef.current = playing; }, [playing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const fontSize = 14;
    let drops: number[] = [];
    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = 300;
      drops = new Array(Math.max(1, Math.floor(canvas.width / fontSize))).fill(0).map(() => Math.floor(Math.random() * -40));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    let raf = 0;
    let last = performance.now();
    let timer = 0;
    const frame = (now: number) => {
      const dt = Math.min(now - last, 100);
      last = now;
      timer += dt;
      if (timer >= 50 / Math.max(0.2, speedRef.current)) {
        timer = 0;
        ctx.fillStyle = "rgba(3,7,18,0.12)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = `${fontSize}px monospace`;
        ctx.fillStyle = colorRef.current;
        for (let i = 0; i < drops.length; i++) {
          const ch = charsetRef.current[Math.floor(Math.random() * charsetRef.current.length)] || " ";
          const y = drops[i] * fontSize;
          ctx.fillText(ch, i * fontSize, y);
          if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
          drops[i]++;
        }
      }
      if (playingRef.current) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <canvas ref={canvasRef} className="w-full rounded-xl border border-border bg-[#030712]" style={{ height: 300 }} />
      </div>
      <div className="grid gap-4 rounded-2xl border border-border bg-card/60 p-4 sm:grid-cols-2">
        <Field label="Character set">
          <TextInput value={charset} onChange={(e) => setCharset(e.target.value)} spellCheck={false} />
        </Field>
        <Field label="Color"><TextInput value={color} onChange={(e) => setColor(e.target.value)} /></Field>
        <Field label={`Speed — ${speed}x`}><input type="range" min={0.2} max={3} step={0.1} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full" /></Field>
        <div className="flex items-end">
          <GhostButton onClick={() => setPlaying((p) => !p)}>{playing ? "Pause" : "Play"}</GhostButton>
        </div>
      </div>
    </div>
  );
}

function SentencePicker() {
  const [text, setText] = useState("");
  const [picked, setPicked] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const sentences = (() => {
    const parts = text.split(/(?<=[.!?。！？])\s+/).filter((s) => s.trim().length > 0);
    if (parts.length) return parts;
    return text.split(/[.!?。！？]/).map((s) => s.trim()).filter(Boolean);
  })();
  const pick = () => {
    if (!sentences.length) return;
    const s = sentences[Math.floor(Math.random() * sentences.length)];
    setPicked(s);
    setHistory((h) => [s, ...h].slice(0, 8));
  };
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 rounded-2xl border border-border bg-card/60 p-4">
        <Field label={`Paragraph — ${sentences.length} sentence${sentences.length === 1 ? "" : "s"} found`}>
          <TextArea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
        </Field>
        <div>
          <PrimaryButton onClick={pick}>Pick a sentence</PrimaryButton>
        </div>
      </div>
      {picked && <OutBox value={picked} mono={false} filename="sentence.txt" />}
      {history.length > 0 && (
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">History</p>
          <ul className="space-y-1.5">
            {history.map((h, i) => (
              <li key={i} className="text-sm text-muted-foreground">{h}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const MALE = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", "Liam", "Noah", "Oliver", "Elijah", "Lucas", "Mason", "Logan", "Alexander", "Ethan", "Daniel", "Jacob", "Henry", "Jack", "Owen", "Finn", "Elias", "Oscar", "Mateo", "Arthur", "Felix"];
const FEMALE = ["Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen", "Olivia", "Emma", "Ava", "Charlotte", "Sophia", "Amelia", "Isabella", "Mia", "Evelyn", "Harper", "Camila", "Gianna", "Luna", "Aria", "Layla", "Nora", "Scarlett", "Aurora", "Naomi", "Eleanor"];
const NEUTRAL = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", "Reese", "Rowan", "Parker", "Skyler", "Sawyer", "River", "Emerson", "Arden", "Kai", "Phoenix", "Robin", "Sage", "Ellis", "Blake", "Drew", "Cameron", "Hayden", "Jude", "Micah", "Nico", "Remi", "Sasha"];
const LAST = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott"];
const DOMAINS = ["example.com", "mail.test", "inbox.dev", "sample.org", "fake.net", "demo.io", "testmail.co", "webmail.com", "u-mail.com", "domain.xyz", "bmail.net", "post.org", "hmmail.io", "dummy.dev", "quick.com"];
const COUNTRIES = ["Germany", "France", "Spain", "Italy", "United States", "Japan", "Brazil", "Canada", "Australia", "India", "Mexico", "Sweden", "Netherlands", "Singapore", "China"];
const CITIES = ["Berlin", "Paris", "Madrid", "Rome", "Tokyo", "Seoul", "Toronto", "Sydney", "Mumbai", "Mexico City", "Stockholm", "Amsterdam", "Singapore", "Shanghai", "São Paulo", "Lagos", "Cairo", "Chicago", "Lyon", "Osaka"];

function FakeUserGen() {
  const [count, setCount] = useState("10");
  const [country, setCountry] = useState("Any");
  const [gender, setGender] = useState("Any");
  const [seed, setSeed] = useState("");
  const [users, setUsers] = useState<Array<{ name: string; email: string; country: string; city: string; phone: string }>>([]);

  const generate = () => {
    const rng = seed !== "" ? mulberry32(Number(seed) || 0) : null;
    const pick = <T,>(arr: T[]): T => rng ? arr[Math.floor(rng() * arr.length)] : arr[Math.floor(Math.random() * arr.length)];
    const n = Math.min(100, Math.max(1, Number(count) || 10));
    const generated = Array.from({ length: n }, () => {
      let first: string;
      if (gender === "Male") first = pick(MALE);
      else if (gender === "Female") first = pick(FEMALE);
      else if (gender === "Neutral") first = pick(NEUTRAL);
      else first = pick([...MALE, ...FEMALE, ...NEUTRAL]);
      const last = pick(LAST);
      const c = country === "Any" ? pick(COUNTRIES) : country;
      const city = pick(CITIES);
      const cc = rng ? String(Math.floor(rng() * 900) + 10) : String(Math.floor(Math.random() * 900) + 10);
      const phoneDigits = rng
        ? Array.from({ length: 9 }, () => Math.floor(rng() * 10)).join("")
        : Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("");
      return {
        name: `${first} ${last}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@${pick(DOMAINS)}`,
        country: c,
        city,
        phone: `+${cc} ${phoneDigits}`,
      };
    });
    setUsers(generated);
  };

  const csv = ["name,email,country,city,phone", ...users.map((u) => `${u.name},${u.email},${u.country},${u.city},${u.phone}`)].join("\n");
  const json = JSON.stringify(users, null, 2);
  const copy = (value: string) => navigator.clipboard?.writeText(value).catch(() => {});
  const download = () => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fake-users.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 rounded-2xl border border-border bg-card/60 p-4 sm:grid-cols-2">
        <Field label="Count"><NumInput min={1} max={100} value={count} onChange={(e) => setCount(e.target.value)} /></Field>
        <Field label="Country"><SelectInput value={country} onChange={(e) => setCountry(e.target.value)} options={["Any", ...COUNTRIES]} /></Field>
        <Field label="Name type"><SelectInput value={gender} onChange={(e) => setGender(e.target.value)} options={["Any", "Male", "Female", "Neutral"]} /></Field>
        <Field label="Seed (optional, for reproducible output)"><TextInput value={seed} onChange={(e) => setSeed(e.target.value)} /></Field>
        <div className="flex flex-wrap items-end gap-2">
          <PrimaryButton onClick={generate}>Generate {users.length ? "more" : "users"}</PrimaryButton>
          {users.length > 0 && (
            <>
              <GhostButton onClick={() => copy(csv)}>Copy CSV</GhostButton>
              <GhostButton onClick={() => copy(json)}>Copy JSON</GhostButton>
              <GhostButton onClick={download}>Download .csv</GhostButton>
            </>
          )}
        </div>
      </div>
      {users.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card/60 p-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-muted-foreground/70">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Country</th>
                <th className="pb-2 pr-4">City</th>
                <th className="pb-2">Phone</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i} className="border-t border-border/60 font-mono">
                  <td className="py-1.5 pr-4 text-foreground">{u.name}</td>
                  <td className="py-1.5 pr-4 text-muted-foreground">{u.email}</td>
                  <td className="py-1.5 pr-4 text-muted-foreground">{u.country}</td>
                  <td className="py-1.5 pr-4 text-muted-foreground">{u.city}</td>
                  <td className="py-1.5 text-muted-foreground">{u.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function MiscTools({ tool }: ToolPageProps) {
  switch (tool.slug) {
    case "list-randomizer": return <ListRandomizer />;
    case "fake-iban-generator": return <FakeIbanGen />;
    case "barcode-generator": return <BarcodeGen />;
    case "unicode-rain": return <UnicodeRain />;
    case "online-sentence-picker": return <SentencePicker />;
    case "fake-user-generator": return <FakeUserGen />;
    default: return null;
  }
}
