import { useMemo, useState } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import { TextArea, TextInput, Chip } from "@/components/tools/shared/fields";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [k: string]: JsonValue };

function countNodes(value: JsonValue): number {
  if (value === null || typeof value !== "object") return 1;
  const entries = Array.isArray(value)
    ? Object.keys(value as JsonValue[])
    : Object.keys(value as { [k: string]: JsonValue });
  return (
    1 +
    entries.reduce(
      (acc, k) => acc + countNodes((value as { [k: string]: JsonValue })[k]),
      0,
    )
  );
}

function entryMatches(key: string, value: JsonValue, q: string): boolean {
  if (key.toLowerCase().includes(q)) return true;
  if (typeof value === "string") return value.toLowerCase().includes(q);
  return false;
}

function colorFor(value: JsonValue): string {
  if (value === null) return "text-muted-foreground";
  if (typeof value === "string") return "text-emerald-400";
  if (typeof value === "number") return "text-sky-400";
  if (typeof value === "boolean") return "text-amber-400";
  return "";
}

function labelFor(value: JsonValue): string {
  if (value === null) return "null";
  if (typeof value === "string") return `"${value}"`;
  return String(value);
}

function TreeNode({
  value,
  name,
  query,
}: {
  value: JsonValue;
  name?: string;
  query: string;
}) {
  const q = query.toLowerCase();
  const nameMatched = name != null && name.toLowerCase().includes(q);
  const valueMatched =
    typeof value === "string" && value.toLowerCase().includes(q);

  if (value === null || typeof value !== "object") {
    return (
      <div className="flex items-start gap-1 py-0.5 hover:bg-black/20">
        {name != null && (
          <span className={nameMatched ? "mr-1 bg-yellow-500/20" : "mr-1"}>
            <span className="text-muted-foreground">{name}</span>
            <span className="text-muted-foreground">: </span>
          </span>
        )}
        <span
          className={`${valueMatched ? "bg-yellow-500/20" : ""} ${colorFor(value)}`}
        >
          {labelFor(value)}
        </span>
      </div>
    );
  }

  const isArray = Array.isArray(value);
  const entries = isArray
    ? (value as JsonValue[]).map(
        (v, i) => [String(i), v] as [string, JsonValue],
      )
    : Object.entries(value as { [k: string]: JsonValue });
  const anyChildMatch = entries.some(([k, v]) => entryMatches(k, v, q));
  const open = !query || nameMatched || anyChildMatch;

  return (
    <details open={open} className="group">
      <summary className="flex cursor-pointer select-none items-center gap-1.5 py-0.5 hover:bg-black/20">
        <span className="text-muted-foreground">{isArray ? "▸" : "▸"}</span>
        <span className={nameMatched ? "bg-yellow-500/20" : ""}>
          {name != null && <span className="mr-1">{name}: </span>}
          <span className="text-muted-foreground">
            {isArray ? `Array(${entries.length})` : `Object(${entries.length})`}
          </span>
        </span>
      </summary>
      <div className="ml-4 border-l border-border pl-2">
        {entries.map(([k, v]) => (
          <TreeNode
            key={k}
            value={v}
            name={isArray ? undefined : k}
            query={query}
          />
        ))}
      </div>
    </details>
  );
}

export default function JsonTreeViewer({ tool }: ToolPageProps) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => {
    if (!input.trim()) return undefined;
    try {
      setError(null);
      return JSON.parse(input) as JsonValue;
    } catch (e) {
      setError((e as Error).message);
      return undefined;
    }
  }, [input]);

  const nodeCount = useMemo(() => (parsed ? countNodes(parsed) : 0), [parsed]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Chip color="bg-ring/15 text-ring">{tool.slug}</Chip>
        {parsed && (
          <span className="text-xs text-muted-foreground">
            {nodeCount} nodes
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="grid gap-3">
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            className="font-mono"
            placeholder='{"name": "Chris", "tags": ["a", "b"]}'
          />
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keys or values…"
          />
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">Invalid JSON: {error}</p>}

      {!input.trim() && (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
          Paste JSON above to view it as a tree.
        </div>
      )}

      {parsed && !error && (
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="max-h-[480px] overflow-auto font-mono text-sm text-foreground">
            <TreeNode value={parsed} query={query} />
          </div>
        </div>
      )}
    </div>
  );
}
