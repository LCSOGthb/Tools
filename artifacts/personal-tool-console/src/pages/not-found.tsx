import { Link } from "wouter";
import { AlertCircle, TerminalSquare } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";

export default function NotFound() {
  usePageTitle("Page not found");
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center lg:px-8">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertCircle className="h-7 w-7" />
      </span>
      <p className="mt-6 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Error 404
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
        That page doesn’t exist
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        The link may be broken, or the page may have moved. Start from the
        catalog, or run a command in the console.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl border border-border bg-card/60 px-4 py-2 text-sm font-medium transition-colors hover:bg-card"
        >
          Browse the catalog
        </Link>
        <Link
          href="/console"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-2 text-sm font-medium transition-colors hover:bg-card"
        >
          <TerminalSquare className="h-4 w-4 text-primary" />
          Open the console
        </Link>
      </div>
    </div>
  );
}
