import { Link, useLocation } from "wouter";
import { Wrench } from "lucide-react";
import { CommandPalette } from "@/components/layout/command-palette";
import { SITE_NAME } from "@/hooks/use-page-title";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Catalog" },
  { href: "/console", label: "Console" },
];

export function SiteHeader() {
  const [path] = useLocation();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Wrench className="h-4 w-4" />
          </span>
          <span>{SITE_NAME}</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((item) => {
            const active = path === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  active && "bg-accent text-accent-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <CommandPalette />
      </div>
    </header>
  );
}
