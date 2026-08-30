import { Suspense, useEffect, useMemo } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { getToolDefinition, TOOL_CATEGORIES, getToolsByCategory } from "@/lib/tool-registry";
import { trackRecentTool } from "@/lib/storage";
import { usePageTitle } from "@/hooks/use-page-title";
import { ToolPageLayout } from "@/components/layout/tool-page-layout";
import ComingSoon from "@/components/tools/shared/coming-soon";
import { Skeleton } from "@/components/ui/skeleton";

export default function ToolPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const tool = useMemo(() => getToolDefinition(slug), [slug]);

  useEffect(() => {
    if (tool && tool.status === "ready") trackRecentTool(tool.slug);
  }, [tool]);

  usePageTitle(tool?.name);

  if (!tool) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center lg:px-8">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">404</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Tool not found</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          “{slug}” isn’t in the toolbox. Check the URL, or browse the catalog to find what you need.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl border border-border bg-card/60 px-4 py-2 text-sm font-medium transition-colors hover:bg-card"
        >
          Back to catalog
        </Link>
      </div>
    );
  }

  const category = TOOL_CATEGORIES[tool.category];
  const related = getToolsByCategory(tool.category)
    .filter((t) => t.slug !== tool.slug && t.status === "ready")
    .slice(0, 6);

  const body =
    tool.status === "coming-soon" || !tool.component ? (
      <ComingSoon tool={tool} />
    ) : (
      <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        }
      >
        <tool.component tool={tool} />
      </Suspense>
    );

  return (
    <ToolPageLayout
      tool={tool}
      category={category}
      related={related}
      onCopyCommand={() => toast("Command copied")}
    >
      {body}
    </ToolPageLayout>
  );
}