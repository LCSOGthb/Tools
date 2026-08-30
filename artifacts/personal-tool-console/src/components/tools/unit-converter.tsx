import { useMemo, useState } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import { getAllUnitCategories, getUnitsForCategory, convertUnits } from "@/lib/tools/unit-converter";
import { Field, SelectInput, NumInput, OutBox, GhostButton } from "@/components/tools/shared/fields";
import { ArrowLeftRight } from "lucide-react";

const FIRST_CATEGORY = getAllUnitCategories()[0];

function firstAndLast(cat: string): [string, string] {
  const units = getUnitsForCategory(cat);
  return [units[0], units[units.length - 1] ?? units[0]];
}

export default function UnitConverterPage({ tool }: ToolPageProps) {
  const [category, setCategory] = useState(FIRST_CATEGORY);
  const [from, setFrom] = useState<string>(() => firstAndLast(FIRST_CATEGORY)[0]);
  const [to, setTo] = useState<string>(() => firstAndLast(FIRST_CATEGORY)[1]);
  const [value, setValue] = useState("1");

  const units = useMemo(() => getUnitsForCategory(category), [category]);

  const onCategory = (cat: string) => {
    const [f, t] = firstAndLast(cat);
    setCategory(cat);
    setFrom(f);
    setTo(t);
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const num = Number(value);
  const result = useMemo(() => {
    if (isNaN(num) || !from || !to || from === to) return "";
    try {
      return String(convertUnits(num, from, to));
    } catch {
      return "";
    }
  }, [num, from, to]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
        <Field label="Category">
          <SelectInput options={getAllUnitCategories()} value={category} onChange={(e) => onCategory(e.target.value)} />
        </Field>
        <Field label="Value">
          <NumInput value={value} onChange={(e) => setValue(e.target.value)} />
        </Field>
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <Field label="From">
            <SelectInput options={units} value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <GhostButton className="px-3" onClick={swap} title="Swap">
            <ArrowLeftRight className="h-4 w-4" />
          </GhostButton>
          <Field label="To">
            <SelectInput options={units} value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
      </div>
      <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
        <OutBox value={result || "—"} mono={false} className="min-h-28" />
      </div>
    </div>
  );
}