import { useState } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import { dnsLookup } from "@/lib/tools/dns";
import { Field, TextInput, PrimaryButton, GhostButton } from "@/components/tools/shared/fields";
import { Search, Loader2 } from "lucide-react";

const TYPES = ["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA"] as const;
type DnsType = (typeof TYPES)[number];

const TYPE_IDS: Record<DnsType, number> = {
  A: 1,
  AAAA: 28,
  MX: 15,
  TXT: 16,
  NS: 2,
  CNAME: 5,
  SOA: 6,
};

interface Row {
  type: DnsType;
  name: string;
  ttl: number | null;
  value: string;
}

export default function DnsLookupPage({ tool }: ToolPageProps) {
  const [domain, setDomain] = useState("");
  const [selected, setSelected] = useState<DnsType[]>(["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA"]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<{ status: string; responseMs: number } | null>(null);
  const [error, setError] = useState("");

  const toggle = (t: DnsType) =>
    setSelected((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const lookup = async () => {
    const host = domain.trim();
    if (!host || selected.length === 0) return;
    setLoading(true);
    setError("");
    setRows([]);
    setMeta(null);
    try {
      const res = await dnsLookup(host);
      const out: Row[] = [];
      for (const t of selected) {
        const q = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${t}`;
        const r = await fetch(q, { headers: { Accept: "application/dns-json" } });
        const data = (await r.json()) as { Status: number; Answer?: { name: string; TTL: number; data: string; type: number }[] };
        for (const rec of data.Answer ?? []) {
          if (rec.type === TYPE_IDS[t]) out.push({ type: t, name: rec.name, ttl: rec.TTL, value: rec.data });
        }
      }
      setRows(out);
      setMeta({ status: res.status, responseMs: res.responseMs });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
        <Field label="Domain">
          <TextInput value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" onKeyDown={(e) => e.key === "Enter" && lookup()} />
        </Field>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggle(t)}
              className={`rounded-full border px-3 py-1.5 font-mono text-xs transition ${selected.includes(t) ? "border-ring/60 bg-ring/10 text-foreground" : "border-border bg-background/60 text-muted-foreground hover:text-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PrimaryButton onClick={lookup} disabled={!domain.trim() || selected.length === 0 || loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? "Looking up…" : "Look up"}
          </PrimaryButton>
          <GhostButton onClick={() => { setRows([]); setMeta(null); setError(""); }} disabled={loading}>
            Clear
          </GhostButton>
        </div>
        {meta && (
          <p className="text-xs text-muted-foreground/70">
            {domain.trim()} · <span className={meta.status === "resolved" ? "text-green-400" : "text-amber-400"}>{meta.status}</span> · {meta.responseMs} ms · via cloudflare-dns.com
          </p>
        )}
      </div>

      {error && <p className="rounded-xl border border-border bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}

      {rows.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/30 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">TTL</th>
                <th className="px-3 py-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-border/60">
                  <td className="px-3 py-2 font-mono text-cyan-300">{r.type}</td>
                  <td className="max-w-52 truncate px-3 py-2 font-mono">{r.name}</td>
                  <td className="px-3 py-2 font-mono">{r.ttl ?? "—"}</td>
                  <td className="break-all px-3 py-2 font-mono">{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && rows.length === 0 && !error && (
        <p className="rounded-xl border border-dashed border-border bg-black/30 p-4 text-sm text-muted-foreground">
          No records yet — enter a domain and pick at least one record type. Records resolve via cloudflare-dns.com DNS-over-HTTPS.
        </p>
      )}
    </div>
  );
}