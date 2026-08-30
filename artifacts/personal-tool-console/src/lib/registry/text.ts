import type { ToolDefinition } from "@/lib/tool-registry";
import { TEXT_GROUPS } from "@/lib/tools/text";
import { tf } from "@/lib/registry/lazy";
import {
  Scissors,
  AlignStartVertical,
  MoveHorizontal,
  WandSparkles,
  Quote,
  ListFilter,
  ArrowUpDown,
  Dices,
  ChartColumn,
  CaseSensitive,
  TextWrap,
  TextQuote,
  Braces,
  Hash,
  Highlighter,
  Type,
  Table,
  Binary,
  TextSelect,
  Pencil,
  TypeOutline,
} from "lucide-react";

const GROUP_ICONS: Record<string, typeof Scissors> = {
  "split-combine": Scissors,
  "alignment-padding": AlignStartVertical,
  reordering: MoveHorizontal,
  "randomize-fake": WandSparkles,
  "prefix-suffix-symbols": Quote,
  filtering: ListFilter,
  sorting: ArrowUpDown,
  "randomize-order": Dices,
  "stats-structure": ChartColumn,
  "case-visual": CaseSensitive,
  "line-breaks-spacing": TextWrap,
  "quotes-style": TextQuote,
  "extraction-encoding": Braces,
  "letters-digits": Hash,
  "highlight-visualize": Highlighter,
  "vowels-consonants": Type,
  "columns-ngrams": Table,
  "misc-encoding": Binary,
  existing: TextSelect,
};

function keywordsFor(name: string, description: string): string[] {
  const parts = new Set<string>();
  for (const w of name.toLowerCase().split(/[^a-z0-9]+/))
    if (w.length > 1) parts.add(w);
  description
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .slice(0, 6)
    .forEach((w) => {
      if (w.length > 2) parts.add(w);
    });
  return [...parts];
}

export const TEXT_SHARED_PAGE = tf(
  () => import("@/components/tools/text/text-tool-page"),
);

export const TEXT_TOOL_DEFS: ToolDefinition[] = TEXT_GROUPS.flatMap((g) =>
  g.tools.map((t) => ({
    slug: t.slug,
    name: t.name,
    description: t.description,
    category: "text" as const,
    icon: GROUP_ICONS[g.id] ?? Type,
    keywords: keywordsFor(t.name, t.description),
    commands: [g.id],
    status: "ready",
    group: g.id,
    component: TEXT_SHARED_PAGE,
  })),
);

export const TEXT_COMING_SOON: ToolDefinition[] = [
  {
    slug: "text-handwriting",
    name: "Handwriting Generator",
    description:
      "Convert text into realistic handwriting-style fonts and PDF worksheets.",
    category: "text",
    icon: Pencil,
    keywords: ["handwriting", "font", "cursive", "script", "worksheet"],
    commands: ["randomize-fake"],
    status: "coming-soon",
  },
  {
    slug: "font-pair-finder",
    name: "Font Pair Finder",
    description:
      "Discover harmonious Google Font pairings for your next design.",
    category: "text",
    icon: TypeOutline,
    keywords: ["font", "pairing", "typography", "google fonts", "match"],
    commands: ["case-visual"],
    status: "coming-soon",
  },
];
