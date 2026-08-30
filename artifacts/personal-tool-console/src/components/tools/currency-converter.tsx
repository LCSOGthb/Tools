import { useMemo, useState } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import { CURRENCY_RATES, CURRENCY_SYMBOLS, convertCurrency, getCurrencyCodes } from "@/lib/tools/currency-converter";
import { Field, SelectInput, NumInput, OutBox, GhostButton } from "@/components/tools/shared/fields";
import { ArrowLeftRight } from "lucide-react";

const CODES = getCurrencyCodes();

function format(n: number, code: string): string {
  const symbol = CURRENCY_SYMBOLS[code] ?? "";
  if (code === "jpy" || code === "idr") return `${symbol}${Math.round(n).toLocaleString()}`;
  return `${symbol}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CurrencyConverterPage({ tool }: ToolPageProps) {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("usd");
  const [to, setTo] = useState("eur");

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const num = Number(amount);
  const result = useMemo(() => {
    if (isNaN(num) || num <= 0 || from === to) return "";
    try {
      return format(convertCurrency(num, from, to), to);
    } catch {
      return "";
    }
  }, [num, from, to]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
          <Field label="Amount">
            <NumInput min={0} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <Field label="From">
              <SelectInput options={CODES.map((c) => c.toUpperCase())} value={from.toUpperCase()} onChange={(e) => setFrom(e.target.value.toLowerCase())} />
            </Field>
            <GhostButton className="px-3" onClick={swap} title="Swap">
              <ArrowLeftRight className="h-4 w-4" />
            </GhostButton>
            <Field label="To">
              <SelectInput options={CODES.map((c) => c.toUpperCase())} value={to.toUpperCase()} onChange={(e) => setTo(e.target.value.toLowerCase())} />
            </Field>
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
          <OutBox value={result ? `${format(num, from)} = ${result}` : "—"} mono={false} className="min-h-28" />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">Rates to USD</span>
          <span className="text-xs text-muted-foreground/60">static reference — manual</span>
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/30 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2 text-right">Rate</th>
              </tr>
            </thead>
            <tbody>
              {CODES.filter((c) => c !== "usd").map((code) => (
                <tr key={code} className="border-t border-border/60">
                  <td className="px-3 py-2 font-mono">{code.toUpperCase()}</td>
                  <td className="px-3 py-2 text-right font-mono">{CURRENCY_RATES[code]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}