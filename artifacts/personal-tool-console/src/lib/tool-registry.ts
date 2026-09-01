import type { ComponentType, LazyExoticComponent } from "react";
import {
  Calculator,
  ArrowLeftRight,
  Sparkles,
  Globe,
  Lock,
  Binary,
  Combine,
  Terminal,
  FileCode2,
  TextCursorInput,
  CodeXml,
  Type,
  Image,
  Palette,
  Share2,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { loadJson, STORAGE_KEYS } from "@/lib/storage";
import { CORE_TOOLS } from "@/lib/registry/core-tools";
import { DEV_TOOLS } from "@/lib/registry/dev-tools";
import { CSS_TOOLS } from "@/lib/registry/css-tools";
import { MEDIA_TOOLS } from "@/lib/registry/media-tools";
import { TEXT_TOOL_DEFS, TEXT_COMING_SOON } from "@/lib/registry/text";

export type ToolCategoryId =
  | "math"
  | "converter"
  | "generator"
  | "network"
  | "crypto"
  | "bitmap"
  | "set"
  | "linux"
  | "xml"
  | "utf8"
  | "coding"
  | "text"
  | "image"
  | "css"
  | "color"
  | "social"
  | "misc";

export type ToolStatus = "ready" | "coming-soon";

export interface ToolPageProps {
  tool: ToolDefinition;
}

export type ToolComponent = LazyExoticComponent<ComponentType<ToolPageProps>>;

export type ToolDefinition = {
  slug: string;
  name: string;
  description: string;
  category: ToolCategoryId;
  tier?: "core" | "standard" | "advanced";
  icon: LucideIcon;
  keywords: string[];
  commands?: string[];
  status: ToolStatus;
  group?: string;
  component?: ToolComponent;
};

export interface ToolCategoryMeta {
  id: ToolCategoryId;
  label: string;
  icon: LucideIcon;
  blurb: string;
}

export const TOOL_CATEGORIES: Record<ToolCategoryId, ToolCategoryMeta> = {
  math: {
    id: "math",
    label: "Math",
    icon: Calculator,
    blurb: "Calculators and expressions",
  },
  converter: {
    id: "converter",
    label: "Converters",
    icon: ArrowLeftRight,
    blurb: "Units, currency, time & radix",
  },
  generator: {
    id: "generator",
    label: "Generators",
    icon: Sparkles,
    blurb: "Passwords, QR codes, UUIDs & keys",
  },
  network: {
    id: "network",
    label: "Network",
    icon: Globe,
    blurb: "DNS, speed and connectivity",
  },
  crypto: {
    id: "crypto",
    label: "Crypto",
    icon: Lock,
    blurb: "Encryption, HMAC, JWT (in-browser)",
  },
  bitmap: {
    id: "bitmap",
    label: "Bitmap",
    icon: Binary,
    blurb: "Bit-level and radix utilities",
  },
  set: {
    id: "set",
    label: "Sets",
    icon: Combine,
    blurb: "Union, intersection & dedupe",
  },
  linux: {
    id: "linux",
    label: "Linux",
    icon: Terminal,
    blurb: "chmod, cron, paths & permissions",
  },
  xml: {
    id: "xml",
    label: "XML",
    icon: FileCode2,
    blurb: "Format, validate & convert XML",
  },
  utf8: {
    id: "utf8",
    label: "UTF-8",
    icon: TextCursorInput,
    blurb: "Bytes, codepoints, BOM & escapes",
  },
  coding: {
    id: "coding",
    label: "Coding",
    icon: CodeXml,
    blurb: "Formatters, encoders & dev aids",
  },
  text: {
    id: "text",
    label: "Text",
    icon: Type,
    blurb: "200+ text manipulation utilities",
  },
  image: {
    id: "image",
    label: "Image",
    icon: Image,
    blurb: "Canvas-based image editing",
  },
  css: {
    id: "css",
    label: "CSS",
    icon: Palette,
    blurb: "CSS generators with live preview",
  },
  color: {
    id: "color",
    label: "Color",
    icon: Palette,
    blurb: "Palettes, shades and converters",
  },
  social: {
    id: "social",
    label: "Social",
    icon: Share2,
    blurb: "Mockups, thumbnails & OG meta",
  },
  misc: {
    id: "misc",
    label: "Misc",
    icon: Wrench,
    blurb: "PDF, barcodes, IBAN, randomizers",
  },
};

export const CATEGORY_ORDER = Object.keys(TOOL_CATEGORIES) as ToolCategoryId[];

export const ALL_TOOLS: ToolDefinition[] = [
  ...CORE_TOOLS,
  ...DEV_TOOLS,
  ...CSS_TOOLS,
  ...MEDIA_TOOLS,
  ...TEXT_TOOL_DEFS,
  ...TEXT_COMING_SOON,
];

export const TOOLS_BY_SLUG = new Map<string, ToolDefinition>(
  ALL_TOOLS.map((t) => [t.slug, t]),
);

export function getToolDefinition(slug: string): ToolDefinition | undefined {
  return TOOLS_BY_SLUG.get(slug);
}

export function getToolsByCategory(category: ToolCategoryId): ToolDefinition[] {
  return ALL_TOOLS.filter((t) => t.category === category);
}

export function getCategoriesWithTools(): Array<
  ToolCategoryMeta & { tools: ToolDefinition[]; ready: number }
> {
  return CATEGORY_ORDER.map((id) => {
    const tools = getToolsByCategory(id);
    return {
      ...TOOL_CATEGORIES[id],
      tools,
      ready: tools.filter((t) => t.status === "ready").length,
    };
  });
}

export function searchTools(query: string, limit = 20): ToolDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = ALL_TOOLS.map((t) => {
    let score = 0;
    if (t.slug.includes(q)) score += 10;
    if (t.name.toLowerCase().includes(q)) score += 8;
    if (t.description.toLowerCase().includes(q)) score += 3;
    for (const k of t.keywords) {
      if (k.includes(q)) score += 6;
      else if (k.startsWith(q)) score += 5;
    }
    if (t.commands?.some((c) => c.toLowerCase().includes(q))) score += 4;
    return { t, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.t.name.localeCompare(b.t.name));
  return scored.slice(0, limit).map((x) => x.t);
}

export function getRecentTools(): ToolDefinition[] {
  const slugs = loadJson<string[]>(STORAGE_KEYS.recentTools, []);
  const found = slugs
    .map((s) => TOOLS_BY_SLUG.get(s))
    .filter((t): t is ToolDefinition => Boolean(t));
  return found.slice(0, 12);
}

export function toOption(value: unknown): string {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return String(value);
  return "";
}
