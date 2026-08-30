import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Search, TerminalSquare } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { searchTools, getRecentTools } from "@/lib/tool-registry";
import type { ToolDefinition } from "@/lib/tool-registry";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [, navigate] = useLocation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => (value.trim() ? searchTools(value, 10) : []), [value]);
  const recents = useMemo(() => (value.trim() ? [] : getRecentTools().slice(0, 5)), [value, open]);

  const run = (url: string) => {
    setOpen(false);
    setValue("");
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    navigate(base + url);
  };

  const ToolRow = ({ tool }: { tool: ToolDefinition }) => {
    const Icon = tool.icon;
    return (
      <CommandItem
        value={`${tool.name} ${tool.slug} ${tool.keywords.join(" ")}`}
        onSelect={() => run(`/tools/${tool.slug}`)}
      >
        <Icon className="mr-2 h-4 w-4" />
        <span className="flex-1 truncate">{tool.name}</span>
        {tool.status === "coming-soon" && (
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Soon</span>
        )}
      </CommandItem>
    );
  };

  return (
    <>
      <div className="hidden items-center gap-2 md:flex">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Search tools…</span>
          <Kbd>⌘K</Kbd>
        </button>
        <button
          type="button"
          onClick={() => run("/console")}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Open command console"
        >
          <TerminalSquare className="h-3.5 w-3.5" />
        </button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search tools, categories…" value={value} onValueChange={setValue} />
        <CommandList>
          <CommandEmpty>No tools found for “{value}”.</CommandEmpty>
          {value.trim() ? (
            <CommandGroup heading="Tools">
              {results.map((tool) => (
                <ToolRow key={tool.slug} tool={tool} />
              ))}
            </CommandGroup>
          ) : (
            <>
              <CommandItem onSelect={() => run("/console")}>
                <TerminalSquare className="mr-2 h-4 w-4" />
                <span className="flex-1">Open command console</span>
              </CommandItem>
              {recents.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Recent">
                    {recents.map((tool) => (
                      <ToolRow key={tool.slug} tool={tool} />
                    ))}
                  </CommandGroup>
                </>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}