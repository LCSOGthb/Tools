import { Construction, Hammer } from "lucide-react";
import type { ToolPageProps } from "@/lib/tool-registry";

export default function ComingSoon({ tool }: ToolPageProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-dashed border-border bg-card/60 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background">
          <Construction className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-base font-semibold">Coming soon</h3>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{tool.name}</span> is on the roadmap and will be available in a future release.
        </p>
        <p className="mx-auto mt-3 max-w-xs text-xs text-muted-foreground/70">{tool.description}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-6">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Hammer className="h-4 w-4" />
          While you wait
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Try another tool in the same category, or head back to the catalog to explore the rest of the toolbox.
        </p>
      </div>
    </div>
  );
}