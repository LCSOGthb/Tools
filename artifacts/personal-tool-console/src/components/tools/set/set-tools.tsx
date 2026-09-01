import { useState, useMemo } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import {
  parseLines,
  setUnion,
  setIntersection,
  setDifference,
  setSymmetricDiff,
  setMembership,
  setDedupe,
} from "@/lib/tools/set";
import {
  Field,
  TextArea,
  OutBox,
  Chip,
} from "@/components/tools/shared/fields";

const OPS: Record<string, (a: string[], b: string[]) => string[]> = {
  "set-union": setUnion,
  "set-intersection": setIntersection,
  "set-difference": setDifference,
  "set-symmetric-difference": setSymmetricDiff,
};

function TwoListPanel({ slug }: { slug: string }) {
  const [aText, setAText] = useState("");
  const [bText, setBText] = useState("");
  const a = useMemo(() => parseLines(aText), [aText]);
  const b = useMemo(() => parseLines(bText), [bText]);
  const op = OPS[slug];
  const result = useMemo(() => {
    try {
      return { values: op(a, b), error: null as string | null };
    } catch (e) {
      return { values: [], error: (e as Error).message };
    }
  }, [op, a, b]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Set A — one item per line">
          <TextArea
            value={aText}
            onChange={(e) => setAText(e.target.value)}
            spellCheck={false}
            placeholder={"apple\nbanana\ncherry"}
          />
        </Field>
        <Field label="Set B — one item per line">
          <TextArea
            value={bText}
            onChange={(e) => setBText(e.target.value)}
            spellCheck={false}
            placeholder={"banana\ncherry\ndate"}
          />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Chip color="bg-ring/15 text-ring">sorted alphabetically</Chip>
        <span className="text-muted-foreground">
          {a.length} × {b.length} items
        </span>
      </div>
      {result.error ? (
        <p className="text-red-400 text-sm">{result.error}</p>
      ) : null}
      {!result.error && (
        <OutBox
          value={
            result.values.length ? result.values.join("\n") : "(empty result)"
          }
        />
      )}
    </div>
  );
}

function MembershipPanel() {
  const [itemsText, setItemsText] = useState("");
  const [setText, setSetText] = useState("");
  const items = useMemo(() => parseLines(itemsText), [itemsText]);
  const pool = useMemo(() => parseLines(setText), [setText]);
  const present = items.filter((i) => setMembership(i, pool)).length;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Items to test — one per line">
          <TextArea
            value={itemsText}
            onChange={(e) => setItemsText(e.target.value)}
            spellCheck={false}
            placeholder={"apple\npear\nkiwi"}
          />
        </Field>
        <Field label="Membership set — one per line">
          <TextArea
            value={setText}
            onChange={(e) => setSetText(e.target.value)}
            spellCheck={false}
            placeholder={"apple\nbanana\ncherry"}
          />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Chip color="bg-green-500/15 text-green-400">{present} present</Chip>
        <Chip color="bg-red-500/15 text-red-400">
          {items.length - present} absent
        </Chip>
      </div>
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="grid gap-1.5">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Type items in the left panel…
            </p>
          )}
          {items.map((item) => {
            const isIn = setMembership(item, pool);
            return (
              <div
                key={item}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-sm odd:bg-background/40"
              >
                <span className="font-mono text-foreground">{item}</span>
                <span className={isIn ? "text-green-400" : "text-red-400"}>
                  {isIn ? "✓ present" : "✗ absent"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DedupePanel() {
  const [text, setText] = useState("");
  const items = useMemo(() => parseLines(text), [text]);
  const out = useMemo(() => setDedupe(items), [items]);

  return (
    <div className="grid gap-4">
      <Field label="Items — one per line (duplicates will be removed)">
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          placeholder={"apple\napple\nbanana\npear\nbanana"}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Chip color="bg-ring/15 text-ring">sorted &amp; deduplicated</Chip>
        <span className="text-muted-foreground">
          {items.length} → {out.length} items
        </span>
      </div>
      <OutBox value={out.length ? out.join("\n") : "(empty)"} />
    </div>
  );
}

export default function SetTools({ tool }: ToolPageProps) {
  switch (tool.slug) {
    case "set-union":
    case "set-intersection":
    case "set-difference":
    case "set-symmetric-difference":
      return <TwoListPanel slug={tool.slug} />;
    case "set-membership":
      return <MembershipPanel />;
    case "set-dedupe":
      return <DedupePanel />;
    default:
      return null;
  }
}
