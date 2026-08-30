import { useState, type KeyboardEvent } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import { isMathExpression, safeMathEval } from "@/lib/tools/calculator";
import { OutBox, GhostButton } from "@/components/tools/shared/fields";

const KEYS = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "%", "+", "(", ")", "^", "C", "⌫", "="];

export default function CalculatorPage({ tool }: ToolPageProps) {
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState<{ value: string; error?: string }>({ value: "" });

  const append = (k: string) => {
    setResult({ value: "" });
    setExpr((prev) => prev + k);
  };

  const evaluate = () => {
    if (!isMathExpression(expr)) {
      setResult({ value: "", error: "Invalid expression" });
      return;
    }
    try {
      const r = safeMathEval(expr);
      setResult({ value: String(r) });
    } catch (e) {
      setResult({ value: "", error: (e as Error).message });
    }
  };

  const backspace = () => {
    setResult({ value: "" });
    setExpr((prev) => prev.slice(0, -1));
  };

  const clear = () => {
    setExpr("");
    setResult({ value: "" });
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") evaluate();
  };

  const current = result.value || expr || "0";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
        <input
          value={expr}
          onChange={(e) => {
            setExpr(e.target.value);
            setResult({ value: "" });
          }}
          onKeyDown={onKey}
          placeholder="Type or click…"
          spellCheck={false}
          className="w-full rounded-xl border border-border bg-black/40 px-4 py-3 font-mono text-right text-2xl text-foreground outline-none focus:border-ring"
        />
        {result.error && <p className="text-right text-sm text-red-400">{result.error}</p>}
        {!result.error && expr && (
          <div className="w-full rounded-xl bg-black/20 px-4 py-2 text-right font-mono text-lg text-muted-foreground">= {current}</div>
        )}
      </div>

      <div className="space-y-2 rounded-2xl border border-border bg-card/60 p-4">
        <div className="grid grid-cols-4 gap-2">
          {KEYS.map((k) => {
            if (k === "C")
              return (
                <button key={k} onClick={clear} className="rounded-xl bg-slate-700/60 py-3 font-mono text-sm text-foreground transition hover:bg-slate-600/60">
                  {k}
                </button>
              );
            if (k === "⌫")
              return (
                <button key={k} onClick={backspace} className="rounded-xl bg-slate-700/60 py-3 font-mono text-sm text-foreground transition hover:bg-slate-600/60">
                  {k}
                </button>
              );
            if (k === "=")
              return (
                <button key={k} onClick={evaluate} className="col-span-2 rounded-xl bg-primary py-3 font-mono text-sm text-primary-foreground transition hover:opacity-90">
                  {k}
                </button>
              );
            if (k === "("  || k === ")" || k === "^")
              return (
                <button key={k} onClick={() => append(k)} className="rounded-xl bg-slate-800/60 py-3 font-mono text-sm text-cyan-300 transition hover:bg-slate-700/60">
                  {k}
                </button>
              );
            const isOp = ["/", "*", "-", "+", "%"].includes(k);
            return (
              <button
                key={k}
                onClick={() => append(k)}
                className={`rounded-xl py-3 font-mono text-sm transition ${isOp ? "bg-orange-500/20 text-orange-300 hover:bg-orange-500/30" : "bg-slate-800/60 text-foreground hover:bg-slate-700/60"}`}
              >
                {k}
              </button>
            );
          })}
        </div>
        <GhostButton className="w-full" onClick={() => navigator.clipboard?.writeText(result.value || expr).catch(() => {})}>
          Copy
        </GhostButton>
      </div>
    </div>
  );
}