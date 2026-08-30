import type { ToolDefinition } from "@/lib/tool-registry";
import { tf } from "@/lib/registry/lazy";
import {
  Calculator, Ruler, Banknote, Timer, KeyRound, Sparkles, ScanBarcode, Hash,
  Globe, Activity, Braces, SquareCheck, GitFork, Binary, Link, CodeXml,
  WandSparkles, Palette, FileJson, Fingerprint, MousePointer2, Box,
} from "lucide-react";

export const CORE_TOOLS: ToolDefinition[] = [
  // --- Core: math / converter / generator / network ---
  {
    slug: "calculator", name: "Calculator", description: "Run an interactive expression with variables and history.",
    category: "math", tier: "core", icon: Calculator, keywords: ["calculator", "expression", "math", "arithmetic"],
    commands: ["calc", "calculate"], status: "ready", component: tf(() => import("@/components/tools/calculator")),
  },
  {
    slug: "unit-converter", name: "Unit Converter", description: "Convert between length, mass, time, speed, area, volume & data.",
    category: "converter", tier: "core", icon: Ruler, keywords: ["units", "convert", "length", "metric", "imperial", "cm", "inches"],
    commands: ["units", "convert"], status: "ready", component: tf(() => import("@/components/tools/unit-converter")),
  },
  {
    slug: "currency-converter", name: "Currency Converter", description: "Convert between 30+ world currencies with offline rates.",
    category: "converter", tier: "core", icon: Banknote, keywords: ["currency", "money", "exchange", "usd", "eur", "foreign"],
    commands: ["currency", "money"], status: "ready", component: tf(() => import("@/components/tools/currency-converter")),
  },
  {
    slug: "timestamp", name: "Epoch Timestamp", description: "Convert between unix epoch and human-readable dates & timezones.",
    category: "converter", tier: "core", icon: Timer, keywords: ["timestamp", "epoch", "unix", "date", "time", "utc"],
    commands: ["time", "timestamp"], status: "ready", component: tf(() => import("@/components/tools/timestamp")),
  },
  {
    slug: "password-generator", name: "Password Generator", description: "Generate strong random passwords and passphrases.",
    category: "generator", tier: "core", icon: KeyRound, keywords: ["password", "passphrase", "random", "secure", "strength"],
    commands: ["password", "passphrase"], status: "ready", component: tf(() => import("@/components/tools/password-generator")),
  },
  {
    slug: "uuid-generator", name: "UUID Generator", description: "Generate v1, v4 and v7 UUIDs in bulk.",
    category: "generator", tier: "core", icon: Sparkles, keywords: ["uuid", "guid", "random", "identifier", "v4", "generator"],
    commands: ["uuid"], status: "ready", component: tf(() => import("@/components/tools/uuid-generator")),
  },
  {
    slug: "qr-generator", name: "QR Code Generator", description: "Generate scannable QR codes from URLs, text, Wi-Fi and more.",
    category: "generator", tier: "core", icon: ScanBarcode, keywords: ["qr", "qrcode", "barcode", "scan", "wifi"],
    commands: ["qr"], status: "ready", component: tf(() => import("@/components/tools/qr-generator")),
  },
  {
    slug: "hash", name: "Hash Generator", description: "Compute MD5, SHA-1, SHA-256, SHA-384, SHA-512 and more.",
    category: "crypto", tier: "core", icon: Hash, keywords: ["hash", "md5", "sha", "checksum", "digest", "verify"],
    commands: ["hash"], status: "ready", component: tf(() => import("@/components/tools/hash")),
  },
  {
    slug: "dns-lookup", name: "DNS Lookup", description: "Resolve A, AAAA, MX, TXT, NS, CNAME and SOA records.",
    category: "network", tier: "core", icon: Globe, keywords: ["dns", "lookup", "domain", "mx", "record", "resolve"],
    commands: ["dns"], status: "ready", component: tf(() => import("@/components/tools/dns-lookup")),
  },
  {
    slug: "speed-test", name: "Speed Test", description: "Measure download, upload, latency and jitter against a CDN.",
    category: "network", tier: "core", icon: Activity, keywords: ["speed", "bandwidth", "internet", "ping", "latency", "test"],
    commands: ["speed"], status: "ready", component: tf(() => import("@/components/tools/speed-test")),
  },

  // --- Coding / developer tools ---
  {
    slug: "json-formatter", name: "JSON Formatter", description: "Pretty-print and validate JSON with syntax highlighting.",
    category: "coding", tier: "core", icon: Braces, keywords: ["json", "format", "pretty", "prettify", "beautify"],
    commands: ["json format", "json pretty"], status: "ready", component: tf(() => import("@/components/tools/json-formatter")),
  },
  {
    slug: "json-minifier", name: "JSON Minifier", description: "Strip whitespace from JSON to a single compact line.",
    category: "coding", icon: Braces, keywords: ["json", "minify", "compact", "strip", "size"],
    commands: ["json minify"], status: "ready", component: tf(() => import("@/components/tools/coding-tools")),
  },
  {
    slug: "json-validator", name: "JSON Validator", description: "Validate JSON and see the exact line/column/offset of errors.",
    category: "coding", icon: SquareCheck, keywords: ["json", "validate", "check", "error", "syntax"],
    commands: ["json validate"], status: "ready", component: tf(() => import("@/components/tools/coding-tools")),
  },
  {
    slug: "json-tree-viewer", name: "JSON Tree Viewer", description: "Explore nested JSON with collapsible nodes and search.",
    category: "coding", icon: GitFork, keywords: ["json", "tree", "viewer", "browse", "nested", "explorer"],
    commands: ["json tree"], status: "ready", component: tf(() => import("@/components/tools/json-tree-viewer")),
  },
  {
    slug: "base64", name: "Base64 Encode/Decode", description: "Encode and decode Base64 strings and files.",
    category: "coding", tier: "core", icon: Binary, keywords: ["base64", "encode", "decode", "binary", "encode64"],
    commands: ["base64"], status: "ready", component: tf(() => import("@/components/tools/base64")),
  },
  {
    slug: "url-encoder", name: "URL Encoder", description: "Percent-encode or decode any string for safe URLs.",
    category: "coding", tier: "core", icon: Link, keywords: ["url", "encode", "decode", "percent", "quotestr", "uri"],
    commands: ["url encode"], status: "ready", component: tf(() => import("@/components/tools/url-encoder")),
  },
  {
    slug: "url-slug", name: "URL Slug Generator", description: "Turn any text into a clean, lowercase, dash-separated slug.",
    category: "coding", icon: Link, keywords: ["slug", "url", "seo", "permalink", "normalize"],
    commands: ["slug"], status: "ready", component: tf(() => import("@/components/tools/coding-tools")),
  },
  {
    slug: "html-encoder", name: "HTML Encoder", description: "Escape or unescape HTML entities (&lt; &amp; etc.).",
    category: "coding", icon: CodeXml, keywords: ["html", "escape", "unescape", "entities", "encode"],
    commands: ["html encode"], status: "ready", component: tf(() => import("@/components/tools/coding-tools")),
  },
  {
    slug: "html-formatter", name: "HTML Formatter", description: "Pretty-print messy HTML with proper indentation.",
    category: "coding", icon: WandSparkles, keywords: ["html", "format", "indent", "pretty", "beautify"],
    commands: ["html format"], status: "ready", component: tf(() => import("@/components/tools/coding-tools")),
  },
  {
    slug: "html-minifier", name: "HTML Minifier", description: "Compress HTML by removing whitespace and comments.",
    category: "coding", icon: WandSparkles, keywords: ["html", "minify", "compress", "size", "speed"],
    commands: ["html minify"], status: "ready", component: tf(() => import("@/components/tools/coding-tools")),
  },
  {
    slug: "css-formatter", name: "CSS Formatter", description: "Beautify and normalize CSS formatting.",
    category: "coding", icon: Palette, keywords: ["css", "format", "indent", "pretty", "beautify"],
    commands: ["css format"], status: "ready", component: tf(() => import("@/components/tools/coding-tools")),
  },
  {
    slug: "css-minifier", name: "CSS Minifier", description: "Compact CSS to save bytes and speed up pages.",
    category: "coding", icon: Palette, keywords: ["css", "minify", "compress", "size"],
    commands: ["css minify"], status: "ready", component: tf(() => import("@/components/tools/coding-tools")),
  },
  {
    slug: "js-formatter", name: "JS Formatter", description: "Pretty-print JavaScript with proper indentation.",
    category: "coding", icon: FileJson, keywords: ["javascript", "format", "beautify", "indent", "prettier"],
    commands: ["js format"], status: "ready", component: tf(() => import("@/components/tools/coding-tools")),
  },
  {
    slug: "js-minifier", name: "JS Minifier", description: "Minify JavaScript to reduce file size.",
    category: "coding", icon: FileJson, keywords: ["javascript", "minify", "compress", "terser"],
    commands: ["js minify"], status: "ready", component: tf(() => import("@/components/tools/coding-tools")),
  },
  {
    slug: "md5-hash", name: "MD5 Hash Calculator", description: "Compute the RFC 1321 MD5 digest of any text.",
    category: "coding", icon: Fingerprint, keywords: ["md5", "hash", "digest", "checksum", "rfc1321"],
    commands: ["md5"], status: "ready", component: tf(() => import("@/components/tools/coding-tools")),
  },
  {
    slug: "code-to-image", name: "Code to Image", description: "Turn a code snippet into a stylish shareable image.",
    category: "image", icon: MousePointer2, keywords: ["code", "snippet", "image", "share", "screenshot", "carbon"],
    commands: ["code image"], status: "ready", component: tf(() => import("@/components/tools/code-to-image")),
  },
  {
    slug: "rn-shadow", name: "React Native Shadow Generator", description: "Craft iOS and Android box-shadows as RN style objects.",
    category: "coding", icon: Box, keywords: ["react native", "shadow", "elevation", "ios", "android", "styles"],
    commands: ["rn shadow"], status: "ready", component: tf(() => import("@/components/tools/rn-shadow")),
  },
];