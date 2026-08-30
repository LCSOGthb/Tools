import { Link } from "wouter";
import { Wrench } from "lucide-react";
import { SITE_NAME } from "@/hooks/use-page-title";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Wrench className="h-4 w-4" />
            </span>
            <span>{SITE_NAME}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">
              Catalog
            </Link>
            <Link
              href="/console"
              className="transition-colors hover:text-foreground"
            >
              Command console
            </Link>
            <span className="text-muted-foreground/60">
              Tools run locally in your browser — nothing is uploaded.
            </span>
          </div>
        </div>
        <p className="mt-6 text-xs text-muted-foreground/50">
          © {new Date().getFullYear()} {SITE_NAME}.
        </p>
      </div>
    </footer>
  );
}
