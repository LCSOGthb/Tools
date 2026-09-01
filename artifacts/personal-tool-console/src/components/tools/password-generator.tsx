import { useEffect, useState } from "react";
import type { ToolPageProps } from "@/lib/tool-registry";
import { randomPassword, strengthScore } from "@/lib/tools/password";
import {
  Field,
  NumInput,
  SelectInput,
  TextInput,
  OutBox,
  PrimaryButton,
} from "@/components/tools/shared/fields";
import { RefreshCcw } from "lucide-react";

export default function PasswordGeneratorPage({ tool }: ToolPageProps) {
  const [length, setLength] = useState(16);
  const [mode, setMode] = useState("strong");
  const [password, setPassword] = useState("");

  const generate = () => setPassword(randomPassword(length, mode));

  useEffect(() => {
    setPassword(randomPassword(length, mode));
  }, [length, mode]);

  const score = strengthScore(password);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
        <div className="space-y-3">
          <Field label={`Length: ${length}`}>
            <input
              type="range"
              min={6}
              max={64}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Length">
              <NumInput
                min={6}
                max={64}
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
              />
            </Field>
            <Field label="Mode">
              <SelectInput
                options={["weak", "medium", "strong"]}
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              />
            </Field>
          </div>
        </div>
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Strength</span>
            <span className="font-medium text-foreground">{score} / 6</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition ${i < score ? (score >= 4 ? "bg-green-400" : score >= 2 ? "bg-amber-400" : "bg-red-400") : "bg-border"}`}
              />
            ))}
          </div>
        </div>
        <PrimaryButton onClick={generate} className="w-full">
          <RefreshCcw className="h-4 w-4" /> Regenerate
        </PrimaryButton>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <OutBox
            value={password}
            className="min-h-28"
            downloadable
            filename="password.txt"
          />
        </div>
        <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
          <Field label="Strength checker" hint="Live-scoring any password">
            <TextInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Type any password…"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
