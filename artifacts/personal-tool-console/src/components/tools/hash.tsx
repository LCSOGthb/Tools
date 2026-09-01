import { useMemo, useState } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import { hashText, hashWithAlgo } from "@/lib/tools/hash";
import {
  Field,
  TextArea,
  TextInput,
  OutBox,
} from "@/components/tools/shared/fields";

const ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
type Algo = (typeof ALGOS)[number];

export default function HashPage({ tool }: ToolPageProps) {
  const [text, setText] = useState("");
  const [expected, setExpected] = useState("");
  const [hashes, setHashes] = useState<Record<Algo, string>>({
    "SHA-1": "",
    "SHA-256": "",
    "SHA-384": "",
    "SHA-512": "",
  });

  useMemo(() => {
    if (!text) {
      setHashes({ "SHA-1": "", "SHA-256": "", "SHA-384": "", "SHA-512": "" });
      return;
    }
    let cancelled = false;
    (async () => {
      const [sha1, sha256, sha384, sha512] = await Promise.all([
        hashWithAlgo(text, "SHA-1"),
        hashWithAlgo(text, "SHA-256"),
        hashWithAlgo(text, "SHA-384"),
        hashWithAlgo(text, "SHA-512"),
      ]);
      if (!cancelled)
        setHashes({
          "SHA-1": sha1,
          "SHA-256": sha256,
          "SHA-384": sha384,
          "SHA-512": sha512,
        });
    })();
    return () => {
      cancelled = true;
    };
  }, [text]);

  const exp = expected.trim();
  const expMatch =
    exp.length > 0
      ? exp.toLowerCase() === hashes["SHA-256"].toLowerCase()
      : null;
  const expValid = exp.length > 0 ? /^[0-9a-fA-F]{0,128}$/.test(exp) : true;

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
        <Field label="Input text" hint="Hashes compute live as you type">
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste text to hash…"
            spellCheck={false}
            rows={6}
          />
        </Field>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
        <Field
          label={`Expected checksum (check against SHA-256, ${hashes["SHA-256"].length} chars)`}
        >
          <TextInput
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            placeholder="e.g. 2cf24dba…"
            spellCheck={false}
          />
        </Field>
        {exp.length > 0 && !expValid && (
          <p className="text-sm text-amber-400">
            Expected checksum contains invalid hex characters.
          </p>
        )}
        {exp.length > 0 && expValid && hashes["SHA-256"] && (
          <p
            className={`text-sm ${expMatch ? "text-green-400" : "text-red-400"}`}
          >
            {expMatch
              ? "✓ Matches the SHA-256 digest."
              : "✗ Does not match the SHA-256 digest."}
          </p>
        )}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {ALGOS.map((algo) => (
          <div
            key={algo}
            className="rounded-2xl border border-border bg-card/60 p-4"
          >
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-foreground">
              {algo}
            </div>
            <OutBox value={hashes[algo] || "—"} />
          </div>
        ))}
      </div>
    </div>
  );
}
