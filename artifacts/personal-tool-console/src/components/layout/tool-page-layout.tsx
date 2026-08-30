import type { ReactNode } from "react";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import type { ToolDefinition, ToolCategoryMeta } from "@/lib/tool-registry";
import { Badge } from "@/components/ui/badge";
import { SquareTerminal, type LucideIcon } from "lucide-react";

function RelatedCard({ tool }: { tool: ToolDefinition }) {
  const Icon = tool.icon;
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="rounded-2xl border border-border bg-card/60 p-4 transition-colors hover:bg-card"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{tool.name}</p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{tool.description}</p>
        </div>
      </div>
    </Link>
  );
}

export function ToolPageLayout({
  tool,
  category,
  related,
  onCopyCommand,
  children,
}: {
  tool: ToolDefinition;
  category: ToolCategoryMeta;
  related: ToolDefinition[];
  onCopyCommand?: () => void;
  children: ReactNode;
}) {
  const CatIcon = category.icon as LucideIcon;
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="transition-colors hover:text-foreground">
          Catalog
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/?category=${category.id}`} className="flex items-center gap-1 transition-colors hover:text-foreground">
          <CatIcon className="h-3.5 w-3.5" />
          {category.label}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate text-foreground">{tool.name}</span>
      </nav>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <tool.icon className="h-6 w-6" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{tool.name}</h1>
              {tool.status === "coming-soon" && (
                <Badge variant="secondary" className="uppercase tracking-wide">
                  Coming soon
                </Badge>
              )}
            </div>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{tool.description}</p>
            {tool.commands && tool.commands.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground/70">Console:</span>
                {tool.commands.slice(0, 3).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(c).catch(() => {});
                      onCopyCommand?.();
                    }}
                    className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    title={`Copy "${c}" to clipboard`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {children}

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <SquareTerminal className="h-4 w-4" />
            More in {category.label}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((t) => (
              <RelatedCard key={t.slug} tool={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}