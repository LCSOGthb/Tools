import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearch } from "wouter";
import { Search, TerminalSquare, Sparkles, Layers, X } from "lucide-react";
import {
  getCategoriesWithTools,
  getRecentTools,
  searchTools,
  type ToolCategoryId,
  type ToolCategoryMeta,
  type ToolDefinition,
} from "@/lib/tool-registry";
import { usePageTitle } from "@/hooks/use-page-title";
import { cn } from "@/lib/utils";

function ToolCard({ tool }: { tool: ToolDefinition }) {
  const Icon = tool.icon;
  const comingSoon = tool.status === "coming-soon";
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={cn(
        "group flex flex-col rounded-2xl border border-border bg-card/60 p-4 transition-colors hover:border-primary/40 hover:bg-card",
        comingSoon && "opacity-75",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
          <Icon className="h-4 w-4" />
        </span>
        {comingSoon && (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Soon
          </span>
        )}
      </div>
      <h3 className="mt-3 text-sm font-medium leading-snug">{tool.name}</h3>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{tool.description}</p>
      {tool.commands && tool.commands[0] && (
        <code className="mt-3 hidden truncate rounded-md bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
          {tool.commands[0]}
        </code>
      )}
    </Link>
  );
}

function SectionGrid({ meta, tools }: { meta: ToolCategoryMeta; tools: ToolDefinition[] }) {
  const Icon = meta.icon;
  const groups = useMemo(() => {
    const map = new Map<string | undefined, ToolDefinition[]>();
    for (const t of tools) {
      const key = t.group;
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [tools]);

  return (
    <section id={meta.id} className="scroll-mt-20">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-lg font-semibold tracking-tight">{meta.label}</h2>
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {tools.filter((t) => t.status === "ready").length}
        </span>
      </div>
      {groups.map(([group, items]) => (
        <div key={group ?? "__root"} className="mb-6">
          {group && (
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">{group}</h3>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export default function Catalog() {
  usePageTitle("All Tools");
  const [query, setQuery] = useState("");
  const search = useSearch();
  const focusedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!search) return;
    const category = new URLSearchParams(search).get("category") as ToolCategoryId | null;
    if (category && focusedRef.current !== category) {
      focusedRef.current = category;
      requestAnimationFrame(() => {
        document.getElementById(category)?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [search]);

  const categories = useMemo(() => getCategoriesWithTools(), []);
  const recent = useMemo(() => getRecentTools(), []);
  const results = useMemo(() => searchTools(query, 40), [query]);
  const totalReady = useMemo(() => categories.reduce((acc, c) => acc + c.ready, 0), [categories]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <section className="mx-auto max-w-3xl pb-10 text-center">
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          Everything runs in your browser
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          One toolbox for text, code, media and more
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          {totalReady} practical utilities across {categories.length} categories — no sign-up, no uploads. Find a tool,
          or type a command into the console.
        </p>
        <div className="relative mx-auto mt-8 max-w-xl">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools… e.g. “iban” or “css shadow”"
            className="h-12 w-full rounded-xl border border-border bg-card/60 pl-11 pr-10 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground/60 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
          <Link
            href="/console"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-2 font-medium transition-colors hover:bg-card"
          >
            <TerminalSquare className="h-4 w-4 text-primary" />
            Open the command console
          </Link>
          {recent.length > 0 && (
            <span className="text-muted-foreground">
              Jump back in:{" "}
              {recent.slice(0, 3).map((t, i) => (
                <span key={t.slug}>
                  {i > 0 && " · "}
                  <Link href={`/tools/${t.slug}`} className="underline decoration-border underline-offset-4 hover:text-foreground">
                    {t.name}
                  </Link>
                </span>
              ))}
            </span>
          )}
        </div>
      </section>

      {query.trim() ? (
        <section className="pb-8">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Layers className="h-4 w-4" />
            {results.length} result{results.length === 1 ? "" : "s"} for “{query.trim()}”
          </h2>
          {results.length === 0 ? (
            <p className="rounded-2xl border border-border bg-card/60 p-6 text-sm text-muted-foreground">
              Nothing matched “{query.trim()}”. Try a broader term, or browse a category below.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="space-y-12">
          {categories.map((meta) => (
            <SectionGrid key={meta.id} meta={meta} tools={meta.tools} />
          ))}
        </div>
      )}
    </div>
  );
}