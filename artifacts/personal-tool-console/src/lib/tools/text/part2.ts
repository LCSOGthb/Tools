import type { TextOpts, TextToolGroup } from "./types";
import {
  randInt,
  pick,
  toLines,
  tokens,
  words,
  sentences,
  paragraphs,
  chunk,
  ALPHABET,
  VOWELS,
  SUPERSCRIPT_MAP,
  SUBSCRIPT_MAP,
  BOLD_MAP,
  ITALIC_MAP,
  MONO_MAP,
  SANS_MAP,
  SCRIPT_MAP,
  CURSIVE_MAP,
  textToMorse,
  morseToText,
  ZALGO_MARKS,
  NUMBER_WORDS,
  toWords,
  unicodeMap,
  stripDiacritics,
  shannonEntropy,
} from "./helpers";

const WORD_RE = /[\p{L}\p{N}_'-]+/gu;

function escClass(c: string): string {
  return /[-\\\]\^]/.test(c) ? "\\" + c : c;
}

function charSet(spec: string, fallback = ""): Set<string> {
  const set = new Set(spec.replace(/[\s,]/g, ""));
  if (set.size === 0 && fallback) for (const c of fallback) set.add(c);
  return set;
}

function quotePair(o: TextOpts): [string, string] {
  const q = String(o.quote ?? '"');
  const open = q.charAt(0);
  const close = q.length > 1 ? q.charAt(q.length - 1) : open;
  return [open, close];
}

function flipCaseChar(c: string): string {
  return c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase();
}

const FONT_MAPS: Record<string, Record<string, string>> = {
  sans: SANS_MAP,
  mono: MONO_MAP,
  bold: BOLD_MAP,
  italic: ITALIC_MAP,
  script: SCRIPT_MAP,
  cursive: CURSIVE_MAP,
};

const FANCY_REV: Record<string, string> = {};
for (const map of [
  SANS_MAP,
  MONO_MAP,
  BOLD_MAP,
  ITALIC_MAP,
  SCRIPT_MAP,
  CURSIVE_MAP,
  SUPERSCRIPT_MAP,
  SUBSCRIPT_MAP,
]) {
  for (const [k, v] of Object.entries(map)) {
    if (!(v in FANCY_REV)) FANCY_REV[v] = k;
  }
}

const UPSIDE_DOWN: Record<string, string> = {
  a: "\u0250",
  b: "q",
  c: "\u0254",
  d: "p",
  e: "\u01dd",
  f: "\u025f",
  g: "\u0183",
  h: "\u0265",
  i: "\u1d09",
  j: "\u027e",
  k: "\u029e",
  l: "l",
  m: "\u026f",
  n: "u",
  o: "o",
  p: "d",
  q: "b",
  r: "\u0279",
  s: "s",
  t: "\u0287",
  u: "n",
  v: "\u028c",
  w: "\u028d",
  x: "x",
  y: "\u028e",
  z: "z",
  "!": "\u00a1",
  "?": "\u00bf",
  ".": "\u02d9",
  ",": "'",
  "(": ")",
  ")": "(",
  "[": "]",
  "]": "[",
};

function capFirst(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

const SYN_MAP: Record<string, string> = {
  great: "excellent",
  good: "fine",
  bad: "poor",
  big: "large",
  small: "tiny",
  very: "extremely",
  quickly: "rapidly",
  happy: "glad",
};

const RU_LAT: Record<string, string> = {
  "\u0430": "a",
  "\u0431": "b",
  "\u0432": "v",
  "\u0433": "g",
  "\u0434": "d",
  "\u0435": "e",
  "\u0436": "zh",
  "\u0437": "z",
  "\u0438": "i",
  "\u0439": "y",
  "\u043a": "k",
  "\u043b": "l",
  "\u043c": "m",
  "\u043d": "n",
  "\u043e": "o",
  "\u043f": "p",
  "\u0440": "r",
  "\u0441": "s",
  "\u0442": "t",
  "\u0443": "u",
  "\u0444": "f",
  "\u0445": "kh",
  "\u0446": "ts",
  "\u0447": "ch",
  "\u0448": "sh",
  "\u0449": "shch",
  "\u044a": "",
  "\u0451": "yo",
  "\u044b": "y",
  "\u044c": "",
  "\u044d": "e",
  "\u044e": "yu",
  "\u044f": "ya",
};

const LAT_RU: Record<string, string> = {};
for (const [k, v] of Object.entries(RU_LAT)) {
  if (v && !(v in LAT_RU)) LAT_RU[v] = k;
}

const QUOTE_PAIRS: [string, string][] = [
  ['"', '"'],
  ["'", "'"],
  ["\u201c", "\u201d"],
  ["\u2018", "\u2019"],
  ["\u00ab", "\u00bb"],
  ["\u201e", "\u201c"],
];

const TAME_CURSES = ["heck", "darn"];

const BAD_WORDS = [
  "damn",
  "hell",
  "crap",
  "shit",
  "fuck",
  "bitch",
  "ass",
  "dick",
];

const COMMON_NAMES = [
  "John",
  "Jane",
  "Mike",
  "Sarah",
  "David",
  "Emily",
  "Tom",
  "Alice",
  "Bob",
  "Carol",
  "Dan",
  "Lisa",
];

const FILLER_WORDS = [
  "the",
  "a",
  "an",
  "of",
  "to",
  "and",
  "in",
  "is",
  "it",
  "for",
  "on",
  "with",
  "as",
  "at",
  "be",
  "this",
  "that",
  "has",
  "are",
  "was",
  "by",
  "from",
  "or",
  "but",
  "not",
  "you",
  "they",
  "we",
  "have",
  "he",
];

type RNode =
  | { t: "char"; c: string }
  | { t: "class"; body: string; neg: boolean }
  | { t: "seq"; nodes: RNode[] }
  | { t: "alt"; alts: RNode[][] }
  | { t: "rep"; node: RNode; min: number; max: number };

const REGEN_CHAR = ALPHABET + ALPHABET.toUpperCase() + "0123456789_ ";

function expandClass(body: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < body.length; i++) {
    if (body[i + 1] === "-" && i + 2 < body.length && body[i] !== "-") {
      const a = body.charCodeAt(i);
      const b = body.charCodeAt(i + 2);
      for (let k = a; k <= b; k++) out.push(String.fromCharCode(k));
      i += 2;
    } else {
      out.push(body[i]);
    }
  }
  return out;
}

function genNode(node: RNode): string {
  switch (node.t) {
    case "char":
      return node.c;
    case "seq": {
      let out = "";
      for (const n of node.nodes) out += genNode(n);
      return out;
    }
    case "alt": {
      const choice = node.alts.length ? randInt(0, node.alts.length - 1) : 0;
      const seq = node.alts[choice] ?? [];
      let out = "";
      for (const n of seq) out += genNode(n);
      return out;
    }
    case "rep": {
      let out = "";
      const count = randInt(node.min, node.max);
      for (let i = 0; i < count; i++) out += genNode(node.node);
      return out;
    }
    case "class": {
      const pool = expandClass(node.body);
      const valid = node.neg
        ? [...REGEN_CHAR].filter((c) => !pool.includes(c))
        : pool.length
          ? pool
          : ["a"];
      return valid[randInt(0, valid.length - 1)] ?? "a";
    }
  }
}

function parseSeq(src: string, i: number): [RNode[], number] {
  const nodes: RNode[] = [];
  while (i < src.length) {
    const ch = src[i];
    if (ch === ")" || ch === "|") break;
    if (ch === "^" || ch === "$") {
      i++;
      continue;
    }
    const [atom, j] = parseAtom(src, i);
    nodes.push(atom);
    i = j;
  }
  return [nodes, i];
}

function parseGroup(src: string, i: number): [RNode, number] {
  const alts: RNode[][] = [];
  let [seq, j] = parseSeq(src, i);
  alts.push(seq);
  while (src[j] === "|") {
    const [next, k] = parseSeq(src, j + 1);
    alts.push(next);
    j = k;
  }
  return [{ t: "alt", alts }, j];
}

function parseAtom(src: string, i: number): [RNode, number] {
  const ch = src[i];
  let node: RNode;
  if (ch === "(") {
    const [inner, j] = parseGroup(src, i + 1);
    node = inner;
    i = j;
    if (src[i] === ")") i++;
  } else if (ch === "[") {
    let j = i + 1;
    let neg = false;
    if (src[j] === "^") {
      neg = true;
      j++;
    }
    let body = "";
    while (j < src.length && src[j] !== "]") {
      if (src[j] === "\\" && j + 1 < src.length) {
        body += src[j + 1];
        j += 2;
        continue;
      }
      if (src[j + 1] === "-" && j + 2 < src.length && src[j + 2] !== "]") {
        body += src[j] + "-" + src[j + 2];
        j += 3;
        continue;
      }
      body += src[j];
      j++;
    }
    if (src[j] === "]") j++;
    node = { t: "class", body, neg };
    i = j;
  } else if (ch === "\\") {
    if (i + 1 >= src.length) return [{ t: "char", c: "\\" }, i + 1];
    const e = src[i + 1];
    i += 2;
    if (e === "d") node = { t: "class", body: "0-9", neg: false };
    else if (e === "D") node = { t: "class", body: "0-9", neg: true };
    else if (e === "w") node = { t: "class", body: "A-Za-z0-9_", neg: false };
    else if (e === "W") node = { t: "class", body: "A-Za-z0-9_", neg: true };
    else if (e === "s") node = { t: "class", body: " ", neg: false };
    else if (e === "S") node = { t: "class", body: " ", neg: true };
    else node = { t: "char", c: e };
  } else if (ch === ".") {
    node = { t: "class", body: "A-Za-z0-9_", neg: false };
    i++;
  } else {
    node = { t: "char", c: ch };
    i++;
  }
  const q = src[i];
  if (q === "?") {
    i++;
    return [{ t: "rep", node, min: 0, max: 1 }, i];
  }
  if (q === "*") {
    i++;
    return [{ t: "rep", node, min: 0, max: 5 }, i];
  }
  if (q === "+") {
    i++;
    return [{ t: "rep", node, min: 1, max: 4 }, i];
  }
  if (q === "{") {
    const end = src.indexOf("}", i);
    if (end !== -1) {
      const spec = src.slice(i + 1, end).match(/^(\d+)(?:,(\d*))?$/);
      if (spec) {
        const min = Number(spec[1]);
        const max =
          spec[2] !== undefined
            ? spec[2] === ""
              ? min + 4
              : Number(spec[2])
            : min;
        return [{ t: "rep", node, min, max }, end + 1];
      }
    }
  }
  return [node, i];
}

function generateFromRegex(src: string): string {
  const [group] = parseGroup(src, 0);
  return genNode(group);
}

export const TEXT_PART2: TextToolGroup[] = [
  {
    id: "case-visual",
    title: "Font, Case & Visual Text",
    description:
      "Transform case, convert between letter fonts, and render visual-text placeholders.",
    tools: [
      {
        slug: "text-case",
        name: "Text Case Converter",
        description:
          "Convert text to upper, lower, title, sentence, snake, camel, kebab, pascal, alternating or reverse case.",
        options: [
          {
            kind: "select",
            key: "case",
            label: "Case",
            options: [
              "upper",
              "lower",
              "title",
              "sentence",
              "snake",
              "camel",
              "kebab",
              "pascal",
              "alternating",
              "reverse",
            ],
            default: "upper",
          },
        ],
        run: (input, o) => {
          const mode = String(o.case ?? "upper");
          switch (mode) {
            case "upper":
              return input.toUpperCase();
            case "lower":
              return input.toLowerCase();
            case "title":
              return input.replace(
                WORD_RE,
                (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
              );
            case "sentence":
              return input.replace(
                /(^|(?<=[.!?…]\s))(\p{L})/gu,
                (_m, _pre: string, letter: string) => letter.toUpperCase(),
              );
            case "snake":
              return words(input).join("_");
            case "camel": {
              const ws = words(input);
              return ws
                .map((w, i) =>
                  i === 0 ? w.toLowerCase() : capFirst(w.toLowerCase()),
                )
                .join("");
            }
            case "kebab":
              return words(input).join("-");
            case "pascal":
              return words(input)
                .map((w) => capFirst(w.toLowerCase()))
                .join("");
            case "alternating":
              return [...input]
                .map((c, i) =>
                  i % 2 === 0 ? c.toLowerCase() : c.toUpperCase(),
                )
                .join("");
            case "reverse":
              return input.replace(/\p{L}/gu, flipCaseChar);
            default:
              return input;
          }
        },
      },
      {
        slug: "proper-case",
        name: "Convert Text to Proper Case",
        description:
          "Capitalize the first letter of every word and lowercase the rest.",
        run: (input) =>
          input.replace(
            WORD_RE,
            (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
          ),
      },
      {
        slug: "randomize-case",
        name: "Randomize Text Case",
        description: "Randomly convert each letter to upper or lower case.",
        run: (input) =>
          input.replace(/\p{L}/gu, (c) =>
            Math.random() < 0.5 ? c.toLowerCase() : c.toUpperCase(),
          ),
      },
      {
        slug: "invert-case",
        name: "Invert Text Case",
        description: "Flip the case of every letter in the text.",
        run: (input) => input.replace(/\p{L}/gu, flipCaseChar),
      },
      {
        slug: "text-as-image",
        name: "Create an Image from Text",
        description:
          "Render the text inside an ASCII frame as a visual banner placeholder.",
        run: (input) => {
          const ls = toLines(input);
          const w = Math.max(1, ...ls.map((l) => l.length));
          const bar = "+" + "-".repeat(w + 2) + "+";
          return [bar, ...ls.map((l) => `| ${l.padEnd(w)} |`), bar].join("\n");
        },
      },
      {
        slug: "scrolling-text",
        name: "Generate Scrolling Text",
        description:
          "Produce a series of frames that scroll the text left across a fixed width.",
        options: [
          {
            kind: "number",
            key: "width",
            label: "Frame width",
            default: 30,
            min: 5,
            max: 200,
            step: 1,
          },
        ],
        run: (input, o) => {
          const width = Math.max(1, Number(o.width ?? 30));
          const text = input && input.length ? input : " ";
          const frames: string[] = [];
          const count = Math.min(width, 60);
          for (let i = 0; i < count; i++) {
            frames.push(`|${(text + text).slice(i, i + width).padEnd(width)}|`);
          }
          return frames.join("\n");
        },
      },
      {
        slug: "text-marquee",
        name: "Create a Text Marquee",
        description:
          "Preview scrolling marquee frames plus a CSS animation snippet.",
        run: (input) => {
          const text = input && input.length ? input : " ";
          const width = text.length;
          const frames: string[] = [];
          for (let i = 0; i < 5; i++) {
            frames.push(`|${(text + text).slice(i, i + width).padEnd(width)}|`);
          }
          return (
            frames.join("\n") +
            "\n/* marquee CSS */ animation: marquee 2s linear infinite;"
          );
        },
      },
      {
        slug: "change-text-font",
        name: "Change Text Font",
        description:
          "Convert text into sans-serif, monospace, bold, italic, script or cursive unicode.",
        options: [
          {
            kind: "select",
            key: "font",
            label: "Font",
            options: ["sans", "mono", "bold", "italic", "script", "cursive"],
            default: "sans",
          },
        ],
        run: (input, o) => {
          const font = String(o.font ?? "sans");
          return unicodeMap(input, FONT_MAPS[font] ?? SANS_MAP);
        },
      },
      {
        slug: "remove-fancy-font",
        name: "Remove Fancy Text Font",
        description:
          "Convert unicode fancy glyphs back to plain ASCII letters.",
        run: (input) =>
          [...input]
            .map((c) => (c in FANCY_REV ? FANCY_REV[c] : stripDiacritics(c)))
            .join(""),
      },
      {
        slug: "superscript-text",
        name: "Write Text in Superscript",
        description: "Convert each character to its unicode superscript form.",
        run: (input) => unicodeMap(input, SUPERSCRIPT_MAP),
      },
      {
        slug: "subscript-text",
        name: "Write Text in Subscript",
        description: "Convert each character to its unicode subscript form.",
        run: (input) => unicodeMap(input, SUBSCRIPT_MAP),
      },
      {
        slug: "tiny-text",
        name: "Generate Tiny Text",
        description:
          "Transform text into superscript, subscript or small-caps styling.",
        options: [
          {
            kind: "select",
            key: "style",
            label: "Style",
            options: ["sup", "sub", "smallcaps"],
            default: "sup",
          },
        ],
        run: (input, o) => {
          const style = String(o.style ?? "sup");
          if (style === "sub") return unicodeMap(input, SUBSCRIPT_MAP);
          if (style === "smallcaps") return input.toUpperCase();
          return unicodeMap(input, SUPERSCRIPT_MAP);
        },
      },
      {
        slug: "bold-text",
        name: "Write Text in Bold",
        description: "Convert text to bold unicode characters.",
        run: (input) => unicodeMap(input, BOLD_MAP),
      },
      {
        slug: "italic-text",
        name: "Write Text in Italic",
        description: "Convert text to italic unicode characters.",
        run: (input) => unicodeMap(input, ITALIC_MAP),
      },
      {
        slug: "cursive-text",
        name: "Write Text in Cursive",
        description: "Convert text to cursive unicode characters.",
        run: (input) => unicodeMap(input, CURSIVE_MAP),
      },
      {
        slug: "underline-text",
        name: "Add an Underline to Text",
        description: "Append a combining low line to every character.",
        run: (input) => [...input].map((c) => c + "\u0332").join(""),
      },
      {
        slug: "strikethrough-text",
        name: "Add a Strikethrough to Text",
        description: "Append a combining long stroke to every character.",
        run: (input) => [...input].map((c) => c + "\u0336").join(""),
      },
      {
        slug: "zalgo-text",
        name: "Generate Zalgo Text",
        description:
          "Corrupt text with a random number of combining marks after each character.",
        options: [
          {
            kind: "number",
            key: "intensity",
            label: "Intensity",
            default: 3,
            min: 0,
            max: 10,
            step: 1,
          },
        ],
        run: (input, o) => {
          const n = Math.max(0, Math.min(10, Number(o.intensity ?? 3)));
          return [...input]
            .map((c) =>
              n > 0
                ? c +
                  Array.from({ length: randInt(0, n) }, () =>
                    pick(ZALGO_MARKS),
                  ).join("")
                : c,
            )
            .join("");
        },
      },
    ],
  },
  {
    id: "line-breaks-spacing",
    title: "Line Breaks, Spacing & Separators",
    description:
      "Rewrite line breaks, spacing and separators between words and columns.",
    tools: [
      {
        slug: "add-line-breaks",
        name: "Add Line Breaks to Text",
        description: "Insert a line break every N characters or every N words.",
        options: [
          {
            kind: "select",
            key: "unit",
            label: "Unit",
            options: ["chars", "words"],
            default: "chars",
          },
          {
            kind: "number",
            key: "every",
            label: "Every",
            default: 20,
            min: 1,
            max: 200,
            step: 1,
          },
        ],
        run: (input, o) => {
          const every = Math.max(1, Number(o.every ?? 20));
          if (String(o.unit ?? "chars") === "words") {
            return chunk(words(input), every)
              .map((g) => g.join(" "))
              .join("\n");
          }
          return (
            input.match(new RegExp(`[\\s\\S]{1,${every}}`, "g")) ?? []
          ).join("\n");
        },
      },
      {
        slug: "remove-line-breaks",
        name: "Remove Line Breaks from Text",
        description: "Replace every newline with a single space.",
        run: (input) => input.replace(/\r\n|\r|\n/g, " "),
      },
      {
        slug: "replace-line-breaks",
        name: "Replace Line Breaks in Text",
        description:
          "Convert line breaks between LF, CRLF, spaces, semicolons or a custom separator.",
        options: [
          {
            kind: "select",
            key: "mode",
            label: "Mode",
            options: [
              "lf2crlf",
              "crlf2lf",
              "lf2space",
              "lf2semicolon",
              "custom",
            ],
            default: "lf2crlf",
          },
          {
            kind: "text",
            key: "custom",
            label: "Custom separator",
            default: " | ",
          },
        ],
        run: (input, o) => {
          switch (String(o.mode ?? "lf2crlf")) {
            case "crlf2lf":
              return input.replace(/\r\n/g, "\n");
            case "lf2space":
              return input.replace(/\r\n|\r|\n/g, " ");
            case "lf2semicolon":
              return input.replace(/\r\n|\r|\n/g, "; ");
            case "custom":
              return input.replace(/\r\n|\r|\n/g, String(o.custom ?? " | "));
            default:
              return input.replace(/\r\n|\r|\n/g, "\r\n");
          }
        },
      },
      {
        slug: "randomize-line-breaks",
        name: "Randomize Line Breaks in Text",
        description: "Re-join the lines with a randomly chosen newline style.",
        run: (input) => toLines(input).join(pick(["\n", "\n\n", "  \n"])),
      },
      {
        slug: "normalize-line-breaks",
        name: "Normalize Line Breaks",
        description: "Convert every line break to LF or CRLF.",
        options: [
          {
            kind: "select",
            key: "eol",
            label: "End of line",
            options: ["lf", "crlf"],
            default: "lf",
          },
        ],
        run: (input, o) =>
          input.replace(
            /\r\n|\r|\n/g,
            String(o.eol ?? "lf") === "crlf" ? "\r\n" : "\n",
          ),
      },
      {
        slug: "fix-paragraph-spacing",
        name: "Fix Distance Between Paragraphs",
        description:
          "Trim lines and separate non-empty paragraphs by exactly one blank line.",
        run: (input) =>
          toLines(input)
            .map((l) => l.trim())
            .filter((l) => l.length > 0)
            .join("\n\n"),
      },
      {
        slug: "fancify-line-breaks",
        name: "Fancify Line Breaks in Text",
        description:
          "Insert a decorative separator line between every pair of lines.",
        run: (input) => toLines(input).join("\n\u2014\u2014\u2014\n"),
      },
      {
        slug: "spaces-to-newlines",
        name: "Convert Spaces to Newlines",
        description: "Replace every space with a newline.",
        run: (input) => input.replace(/ /g, "\n"),
      },
      {
        slug: "newlines-to-spaces",
        name: "Convert Newlines to Spaces",
        description: "Replace every newline with a space.",
        run: (input) => input.replace(/\r\n|\r|\n/g, " "),
      },
      {
        slug: "spaces-to-tabs",
        name: "Convert Spaces to Tabs",
        description: "Replace runs of N spaces with a tab character.",
        options: [
          {
            kind: "number",
            key: "spacesPerTab",
            label: "Spaces per tab",
            default: 4,
            min: 1,
            max: 16,
            step: 1,
          },
        ],
        run: (input, o) => {
          const n = Math.max(1, Number(o.spacesPerTab ?? 4));
          return input.replace(new RegExp(` {${n}}`, "g"), "\t");
        },
      },
      {
        slug: "tabs-to-spaces",
        name: "Convert Tabs to Spaces",
        description: "Replace every tab with a chosen number of spaces.",
        options: [
          {
            kind: "number",
            key: "spaces",
            label: "Spaces",
            default: 4,
            min: 1,
            max: 16,
            step: 1,
          },
        ],
        run: (input, o) =>
          input.replace(/\t/g, " ".repeat(Math.max(1, Number(o.spaces ?? 4)))),
      },
      {
        slug: "comma-to-newline",
        name: "Convert Comma to Newline",
        description: "Replace every comma with a newline.",
        run: (input) => input.replace(/,/g, "\n"),
      },
      {
        slug: "newline-to-comma",
        name: "Convert Newline to Comma",
        description: "Replace every line break with a comma and a space.",
        run: (input) => input.replace(/\r\n|\r|\n/g, ", "),
      },
      {
        slug: "column-to-comma",
        name: "Convert Column to Comma",
        description: "Join every line as a row, separated by commas.",
        run: (input) =>
          toLines(input)
            .map((l) => l.trim())
            .join(", "),
      },
      {
        slug: "comma-to-column",
        name: "Convert Comma to Column",
        description: "Split on commas and put one trimmed item per line.",
        run: (input) =>
          input
            .split(",")
            .map((s) => s.trim())
            .join("\n"),
      },
      {
        slug: "commas-to-spaces",
        name: "Convert Commas to Spaces",
        description: "Replace every comma with a space.",
        run: (input) => input.replace(/,/g, " "),
      },
      {
        slug: "spaces-to-commas",
        name: "Convert Spaces to Commas",
        description: "Replace whitespace runs with a comma and a space.",
        run: (input) => input.replace(/\s+/g, ", ").trim(),
      },
      {
        slug: "replace-commas",
        name: "Replace Commas in Text",
        description: "Replace every comma with a chosen string.",
        options: [
          { kind: "text", key: "replace", label: "Replace with", default: ";" },
        ],
        run: (input, o) => input.replace(/,/g, String(o.replace ?? ";")),
      },
      {
        slug: "remove-extra-spaces",
        name: "Remove Extra Spaces",
        description: "Collapse runs of spaces and tabs down to a single space.",
        run: (input) => input.replace(/[ \t]+/g, " "),
      },
      {
        slug: "increase-spacing",
        name: "Increase Text Spacing",
        description:
          "Insert a fill character between every character or every word.",
        options: [
          {
            kind: "select",
            key: "target",
            label: "Target",
            options: ["chars", "words"],
            default: "chars",
          },
          { kind: "text", key: "fill", label: "Fill", default: " " },
        ],
        run: (input, o) => {
          const fill = String(o.fill ?? " ");
          if (String(o.target ?? "chars") === "words") {
            return input.replace(/(\S+)(\s+)/g, `$1${fill}`).trim();
          }
          return [...input].join(fill);
        },
      },
      {
        slug: "normalize-spacing",
        name: "Normalize Text Spacing",
        description:
          "Collapse all whitespace runs to one space and trim the ends.",
        run: (input) => input.replace(/\s+/g, " ").trim(),
      },
      {
        slug: "randomize-spacing",
        name: "Randomize Text Spacing",
        description:
          "Replace every whitespace run with a random 1-4 space run.",
        run: (input) =>
          input.replace(/\s+/g, () => " ".repeat(randInt(1, 4))).trim(),
      },
      {
        slug: "replace-spaces",
        name: "Replace Spaces in Text",
        description: "Replace every whitespace character with a chosen string.",
        options: [
          { kind: "text", key: "replace", label: "Replace with", default: "-" },
        ],
        run: (input, o) => input.replace(/\s/g, String(o.replace ?? "-")),
      },
      {
        slug: "remove-all-whitespace",
        name: "Remove All Whitespace",
        description: "Strip every whitespace character from the text.",
        run: (input) => input.replace(/\s+/g, ""),
      },
      {
        slug: "remove-punctuation",
        name: "Remove All Punctuation",
        description:
          "Keep letters, digits, whitespace and _ - ' . while removing everything else.",
        run: (input) => input.replace(/[^\p{L}\p{N}\s_'.+-]/gu, ""),
      },
      {
        slug: "remove-diacritics",
        name: "Remove Diacritics from Text",
        description:
          "Strip accents and combining marks, returning plain ASCII letters.",
        run: (input) => stripDiacritics(input),
      },
    ],
  },
  {
    id: "quotes-style",
    title: "Quotes & Content Style",
    description:
      "Add and remove quotes, shift letters, and clean up offensive or identifying content.",
    tools: [
      {
        slug: "increment-letters",
        name: "Increment Letters in Text",
        description: "Shift every letter forward in the alphabet (Caesar).",
        options: [
          {
            kind: "number",
            key: "shift",
            label: "Shift",
            default: 1,
            min: 1,
            max: 26,
            step: 1,
          },
        ],
        run: (input, o) => {
          const shift = Number(o.shift ?? 1) % 26;
          return input.replace(/[a-zA-Z]/g, (c) => {
            const code = c.charCodeAt(0);
            const base = code < 97 ? 65 : 97;
            return String.fromCharCode(
              ((code - base + shift + 26) % 26) + base,
            );
          });
        },
      },
      {
        slug: "decrement-letters",
        name: "Decrement Letters in Text",
        description: "Shift every letter backward in the alphabet (Caesar).",
        options: [
          {
            kind: "number",
            key: "shift",
            label: "Shift",
            default: 1,
            min: 1,
            max: 26,
            step: 1,
          },
        ],
        run: (input, o) => {
          const shift = Number(o.shift ?? 1) % 26;
          return input.replace(/[a-zA-Z]/g, (c) => {
            const code = c.charCodeAt(0);
            const base = code < 97 ? 65 : 97;
            return String.fromCharCode(
              ((code - base - shift + 26) % 26) + base,
            );
          });
        },
      },
      {
        slug: "add-quotes",
        name: "Add Quotes to Text",
        description: "Wrap the whole text in a chosen quote character or pair.",
        options: [{ kind: "text", key: "quote", label: "Quote", default: '"' }],
        run: (input, o) => {
          const [open, close] = quotePair(o);
          return open + input + close;
        },
      },
      {
        slug: "remove-quotes",
        name: "Remove Quotes from Text",
        description:
          "Strip a matching pair of surrounding quote characters if present.",
        run: (input) => {
          for (const [open, close] of QUOTE_PAIRS) {
            if (input.startsWith(open) && input.endsWith(close)) {
              return input.slice(open.length, input.length - close.length);
            }
          }
          return input;
        },
      },
      {
        slug: "add-quotes-to-words",
        name: "Add Quotes to Words",
        description: "Wrap every word with the chosen quote character.",
        options: [{ kind: "text", key: "quote", label: "Quote", default: '"' }],
        run: (input, o) => {
          const [open, close] = quotePair(o);
          return input.replace(WORD_RE, (w) => open + w + close);
        },
      },
      {
        slug: "remove-quotes-from-words",
        name: "Remove Quotes from Words",
        description: "Strip quote characters from around every word.",
        run: (input) =>
          input.replace(WORD_RE, (w) =>
            w.replace(
              /^["'\u201c\u201d\u2018\u2019\u00ab\u00bb]+|["'\u201c\u201d\u2018\u2019\u00ab\u00bb]+$/g,
              "",
            ),
          ),
      },
      {
        slug: "add-quotes-to-lines",
        name: "Add Quotes to Lines",
        description: "Wrap every line with the chosen quote character.",
        options: [{ kind: "text", key: "quote", label: "Quote", default: '"' }],
        run: (input, o) => {
          const [open, close] = quotePair(o);
          return toLines(input)
            .map((l) => open + l + close)
            .join("\n");
        },
      },
      {
        slug: "remove-quotes-from-lines",
        name: "Remove Quotes from Lines",
        description: "Strip surrounding quote characters from every line.",
        run: (input) =>
          toLines(input)
            .map((l) =>
              l.replace(
                /^["'\u201c\u201d\u2018\u2019\u00ab\u00bb]+|["'\u201c\u201d\u2018\u2019\u00ab\u00bb]+$/g,
                "",
              ),
            )
            .join("\n"),
      },
      {
        slug: "add-curse-words",
        name: "Add Curse Words To Text",
        description:
          "Insert tame filler words like heck or darn at random word positions.",
        options: [
          {
            kind: "number",
            key: "rate",
            label: "How many to add",
            default: 2,
            min: 0,
            max: 10,
            step: 1,
          },
        ],
        run: (input, o) => {
          const rate = Math.max(0, Math.floor(Number(o.rate ?? 2)));
          const ws = words(input);
          if (rate === 0 || ws.length === 0) return input;
          const positions = new Set<number>();
          const max = Math.min(rate, ws.length);
          while (positions.size < max) positions.add(randInt(0, ws.length - 1));
          let idx = -1;
          return input.replace(WORD_RE, (w) => {
            idx++;
            return positions.has(idx) ? w + " " + pick(TAME_CURSES) : w;
          });
        },
      },
      {
        slug: "censor-words",
        name: "Censor Words in Text",
        description:
          "Replace profanity with asterisks, stars or a censored label.",
        options: [
          {
            kind: "select",
            key: "filler",
            label: "Filler",
            options: ["asterisks", "censored", "stars"],
            default: "asterisks",
          },
        ],
        run: (input, o) => {
          const mode = String(o.filler ?? "asterisks");
          const re = new RegExp(`\\b(?:${BAD_WORDS.join("|")})\\b`, "giu");
          return input.replace(re, (w) => {
            if (mode === "censored") return "[censored]";
            if (mode === "stars") return "*".repeat(w.length);
            return w.charAt(0) + "*".repeat(w.length - 1);
          });
        },
      },
      {
        slug: "anonymize-text",
        name: "Anonymize Text",
        description: "Mask emails, number sequences and common first names.",
        run: (input) => {
          let out = input.replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "[email]");
          out = out.replace(/\d{3,}/g, "[number]");
          return out.replace(
            new RegExp(`\\b(?:${COMMON_NAMES.join("|")})\\b`, "giu"),
            "[name]",
          );
        },
      },
    ],
  },
  {
    id: "extraction-encoding",
    title: "Extraction, Parsing & Encoding",
    description:
      "Strip markup, parse structured text, apply ciphers and generate/glue text.",
    tools: [
      {
        slug: "extract-text-from-html",
        name: "Extract Text from HTML",
        description:
          "Strip HTML tags and decode common entities with regex only.",
        run: (input) => {
          let out = input.replace(/<[^>]*>/g, "");
          out = out
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;|&apos;/g, "'")
            .replace(/&nbsp;/g, " ");
          return toLines(out)
            .map((l) => l.replace(/\s+/g, " ").trim())
            .join("\n");
        },
      },
      {
        slug: "extract-text-from-xml",
        name: "Extract Text from XML",
        description: "Strip XML tags and collapse whitespace per line.",
        run: (input) =>
          toLines(input.replace(/<[^>]*>/g, ""))
            .map((l) => l.replace(/\s+/g, " ").trim())
            .join("\n"),
      },
      {
        slug: "extract-text-from-bbcode",
        name: "Extract Text from BBCode",
        description: "Remove BBCode tags and their attributes.",
        run: (input) =>
          input.replace(/\[\/?[a-zA-Z0-9*=#]+[^\]]*\]/gi, "").trim(),
      },
      {
        slug: "extract-text-from-json",
        name: "Extract Text from JSON",
        description:
          "Parse JSON and output every leaf string value, one per line.",
        run: (input) => {
          try {
            const parsed: unknown = JSON.parse(input);
            const leaves: string[] = [];
            const walk = (v: unknown): void => {
              if (typeof v === "string") {
                leaves.push(v);
              } else if (Array.isArray(v)) {
                for (const x of v) walk(x);
              } else if (v !== null && typeof v === "object") {
                for (const x of Object.values(v)) walk(x);
              }
            };
            walk(parsed);
            return leaves.join("\n");
          } catch {
            return input;
          }
        },
      },
      {
        slug: "json-stringify",
        name: "JSON Stringify Text",
        description: "Serialize the input as a JSON string literal.",
        run: (input) => JSON.stringify(input),
      },
      {
        slug: "json-unstringify",
        name: "JSON Unstringify Text",
        description: "Parse a JSON string literal back into plain text.",
        run: (input) => {
          try {
            const v: unknown = JSON.parse(input);
            if (typeof v === "string") return v;
            return JSON.stringify(v);
          } catch {
            return "Invalid JSON";
          }
        },
      },
      {
        slug: "slash-escape",
        name: "Slash-escape Text",
        description: "Escape backslashes, quotes and control characters.",
        run: (input) =>
          input
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"')
            .replace(/'/g, "\\'")
            .replace(/\n/g, "\\n")
            .replace(/\t/g, "\\t")
            .replace(/\r/g, "\\r"),
      },
      {
        slug: "slash-unescape",
        name: "Slash-unescape Text",
        description:
          "Resolve escaped sequences and unicode escapes back to characters.",
        run: (input) => {
          let out = "";
          for (let i = 0; i < input.length; i++) {
            const ch = input[i];
            if (ch !== "\\" || i + 1 >= input.length) {
              out += ch;
              continue;
            }
            const next = input[i + 1];
            if (next === "n") {
              out += "\n";
              i++;
            } else if (next === "t") {
              out += "\t";
              i++;
            } else if (next === "r") {
              out += "\r";
              i++;
            } else if (next === '"') {
              out += '"';
              i++;
            } else if (next === "'") {
              out += "'";
              i++;
            } else if (next === "\\") {
              out += "\\";
              i++;
            } else if (next === "u") {
              const hex = input.slice(i + 2, i + 6);
              if (/^[0-9a-fA-F]{4}$/.test(hex)) {
                out += String.fromCharCode(parseInt(hex, 16));
                i += 5;
              } else {
                out += "\\";
              }
            } else {
              out += "\\";
            }
          }
          return out;
        },
      },
      {
        slug: "rot13",
        name: "ROT13 Text",
        description: "Rotate every letter by 13 alphabet positions.",
        run: (input) =>
          input.replace(/[a-zA-Z]/g, (c) => {
            const code = c.charCodeAt(0);
            const base = code < 97 ? 65 : 97;
            return String.fromCharCode(((code - base + 13) % 26) + base);
          }),
      },
      {
        slug: "rot47",
        name: "ROT47 Text",
        description:
          "Rotate printable ASCII characters (33-126) by 47 positions.",
        run: (input) =>
          input.replace(/[!-~]/g, (c) => {
            const code = c.charCodeAt(0);
            return String.fromCharCode(code <= 79 ? code + 47 : code - 47);
          }),
      },
      {
        slug: "text-of-length",
        name: "Generate Text of Certain Length",
        description:
          "Generate random readable text or random characters with an exact length.",
        options: [
          {
            kind: "number",
            key: "length",
            label: "Length",
            default: 100,
            min: 1,
            max: 10000,
            step: 1,
          },
          {
            kind: "toggle",
            key: "readable",
            label: "Readable words",
            default: true,
          },
        ],
        run: (_input, o) => {
          const length = Math.max(0, Math.floor(Number(o.length ?? 100)));
          if (o.readable === false) {
            let out = "";
            while (out.length < length)
              out += ALPHABET[randInt(0, ALPHABET.length - 1)];
            return out.slice(0, length);
          }
          let out = "";
          while (out.length < length) {
            const w = pick(FILLER_WORDS);
            const add = out.length === 0 ? w : " " + w;
            if (out.length + add.length > length) break;
            out += add;
          }
          return out.padEnd(length, " ");
        },
      },
      {
        slug: "text-from-regexp",
        name: "Generate Text from a RegExp",
        description: "Generate random text that matches a regular expression.",
        options: [
          {
            kind: "text",
            key: "regexp",
            label: "Regular expression",
            default: "^[a-z]{0,8}$",
          },
        ],
        run: (_input, o) => {
          const src = String(o.regexp ?? "^[a-z]{0,8}$");
          try {
            return generateFromRegex(src);
          } catch {
            const spec = src.match(/\{(\d+)(?:,(\d*))?\}/);
            const min = spec ? Number(spec[1]) : 0;
            const max = spec
              ? spec[2]
                ? Math.max(min, Number(spec[2]) || min + 4)
                : min
              : 8;
            const len = randInt(min, Math.min(max, 40));
            const pool = (
              ALPHABET +
              ALPHABET.toUpperCase() +
              "0123456789"
            ).split("");
            let out = "";
            for (let i = 0; i < len; i++) out += pick(pool);
            return out;
          }
        },
      },
      {
        slug: "extract-regexp",
        name: "Extract RegExp Matches",
        description: "Output every match of the pattern, one per line.",
        options: [
          {
            kind: "text",
            key: "regexp",
            label: "Regular expression",
            default: "\\d+",
          },
        ],
        run: (input, o) => {
          try {
            const re = new RegExp(String(o.regexp ?? "\\d+"), "gu");
            const ms = [...input.matchAll(re)];
            return ms.length ? ms.map((m) => m[0]).join("\n") : "(no matches)";
          } catch (e) {
            return (
              "Invalid regex: " + (e instanceof Error ? e.message : String(e))
            );
          }
        },
      },
      {
        slug: "highlight-regexp",
        name: "Highlight RegExp Matches",
        description: "Wrap every match of the pattern in ** markers.",
        options: [
          {
            kind: "text",
            key: "regexp",
            label: "Regular expression",
            default: "\\d+",
          },
        ],
        run: (input, o) => {
          try {
            const re = new RegExp(String(o.regexp ?? "\\d+"), "gu");
            return input.replace(re, (m) => `**${m}**`);
          } catch (e) {
            return (
              "Invalid regex: " + (e instanceof Error ? e.message : String(e))
            );
          }
        },
      },
      {
        slug: "test-regexp",
        name: "Test Text with a RegExp",
        description:
          "Report whether the pattern matches, its groups, and the match count.",
        options: [
          {
            kind: "text",
            key: "regexp",
            label: "Regular expression",
            default: "\\d+",
          },
        ],
        run: (input, o) => {
          try {
            const re = new RegExp(String(o.regexp ?? "\\d+"), "gu");
            const ms = [...input.matchAll(re)];
            return [
              `Match: ${ms.length > 0}`,
              `Groups: ${ms.length ? JSON.stringify(ms[0].slice(1)) : "[]"}`,
              `Matches: ${ms.length}`,
            ].join("\n");
          } catch (e) {
            return (
              "Invalid regex: " + (e instanceof Error ? e.message : String(e))
            );
          }
        },
      },
      {
        slug: "printf-text",
        name: "Printf Text",
        description:
          "Format input words using printf-style placeholders like %s, %d, %x.",
        options: [
          {
            kind: "text",
            key: "format",
            label: "Format string",
            default: "%s %d",
          },
        ],
        run: (input, o) => {
          const format = String(o.format ?? "%s %d");
          const args = input.trim() ? tokens(input) : [];
          let ai = 0;
          let out = "";
          for (let i = 0; i < format.length; ) {
            const ch = format[i];
            if (ch !== "%") {
              out += ch;
              i++;
              continue;
            }
            const spec = format[i + 1];
            if (spec === "%") {
              out += "%";
              i += 2;
              continue;
            }
            const arg = ai < args.length ? args[ai] : "";
            ai++;
            switch (spec) {
              case "s":
                out += arg;
                break;
              case "d": {
                const n = Number(arg);
                out += Number.isNaN(n) ? "0" : String(Math.trunc(n));
                break;
              }
              case "f": {
                const n = Number(arg);
                out += Number.isNaN(n) ? "0" : String(n);
                break;
              }
              case "x":
                out += Number(arg).toString(16);
                break;
              case "b":
                out += Number(arg).toString(2);
                break;
              case "o":
                out += Number(arg).toString(8);
                break;
              default:
                out += ch + (spec ?? "");
                break;
            }
            i += 2;
          }
          return out;
        },
      },
      {
        slug: "rotate-text",
        name: "Rotate Text",
        description:
          "Rotate text 180 degrees, flip vertically or flip horizontally.",
        options: [
          {
            kind: "select",
            key: "dir",
            label: "Direction",
            options: ["flip180", "flipV", "flipH"],
            default: "flip180",
          },
        ],
        run: (input, o) => {
          switch (String(o.dir ?? "flip180")) {
            case "flip180":
              return [...input]
                .reverse()
                .map((c) => UPSIDE_DOWN[c] ?? c)
                .join("");
            case "flipV":
              return toLines(input).reverse().join("\n");
            default:
              return toLines(input)
                .map((l) => [...l].reverse().join(""))
                .join("\n");
          }
        },
      },
      {
        slug: "flip-text",
        name: "Flip Text Vertically",
        description: "Reverse the order of the lines.",
        run: (input) => toLines(input).reverse().join("\n"),
      },
      {
        slug: "rewrite-text",
        name: "Rewrite Text",
        description:
          "Substitute common words with synonyms using a fixed thesaurus map.",
        run: (input) =>
          input.replace(WORD_RE, (w) => {
            const rep = SYN_MAP[w.toLowerCase()];
            if (rep === undefined) return w;
            const first = w.charAt(0);
            const isTitle =
              first === first.toUpperCase() && first !== first.toLowerCase();
            return isTitle ? capFirst(rep) : rep;
          }),
      },
      {
        slug: "change-alphabet",
        name: "Change Text Alphabet",
        description: "Transliterate between Cyrillic and Latin alphabets.",
        run: (input) =>
          /[\u0400-\u04ff]/u.test(input)
            ? [...input]
                .map((c) => {
                  const low = c.toLowerCase();
                  const m = RU_LAT[low];
                  if (m === undefined) return c;
                  return c === low ? m : capFirst(m);
                })
                .join("")
            : [...input]
                .map((c) => {
                  const low = c.toLowerCase();
                  const m = LAT_RU[low];
                  if (m === undefined) return c;
                  return c === low ? m : m.toUpperCase();
                })
                .join(""),
      },
      {
        slug: "replace-letters",
        name: "Replace Letters in Text",
        description:
          "Replace every listed letter with a single chosen character.",
        options: [
          {
            kind: "text",
            key: "find",
            label: "Letters to replace",
            default: "a e i o u",
          },
          { kind: "text", key: "replace", label: "Replace with", default: "x" },
        ],
        run: (input, o) => {
          const set = charSet(String(o.find ?? "a e i o u"));
          if (set.size === 0) return input;
          const re = new RegExp(`[${[...set].map(escClass).join("")}]`, "g");
          return input.replace(re, String(o.replace ?? "x"));
        },
      },
    ],
  },
  {
    id: "letters-digits",
    title: "Letters \u2194 Digits & Letters/Word Editing",
    description:
      "Convert between letters and digits, and edit letters or words by position.",
    tools: [
      {
        slug: "letters-to-digits",
        name: "Convert Letters to Digits",
        description:
          "Map A=1..Z=26, A=0..Z=25, or per-letter numbers. Sums per line when separate is on.",
        options: [
          {
            kind: "select",
            key: "mode",
            label: "Mode",
            options: ["a1", "a0", "each"],
            default: "a1",
          },
          {
            kind: "toggle",
            key: "separate",
            label: "Separate per line",
            default: false,
          },
        ],
        run: (input, o) => {
          const mode = String(o.mode ?? "a1");
          const separate = o.separate === true;
          const offsets: Record<string, number> = { a1: 1, a0: 0, each: 1 };
          const off = offsets[mode] ?? 1;
          const sum = (s: string): number => {
            let t = 0;
            for (const c of s.toLowerCase()) {
              const i = c.charCodeAt(0) - 97;
              if (i >= 0 && i < 26) t += i + off;
            }
            return t;
          };
          if (mode === "each") {
            const nums: string[] = [];
            for (const c of input.toLowerCase()) {
              const i = c.charCodeAt(0) - 97;
              if (i >= 0 && i < 26) nums.push(String(i + 1));
            }
            return nums.join(" ");
          }
          return separate
            ? toLines(input).map(sum).join("\n")
            : String(sum(input));
        },
      },
      {
        slug: "digits-to-letters",
        name: "Convert Digits to Letters",
        description: "Map each digit to a letter using A=1 or A=0 numbering.",
        options: [
          {
            kind: "select",
            key: "mode",
            label: "Mode",
            options: ["1a", "0a"],
            default: "1a",
          },
        ],
        run: (input, o) => {
          const mode = String(o.mode ?? "1a");
          return input.replace(/\d/g, (d) => {
            const v = Number(d);
            if (mode === "0a") return String.fromCharCode(v + 65);
            return v === 0 ? "Z" : String.fromCharCode(64 + v);
          });
        },
      },
      {
        slug: "words-to-digits",
        name: "Replace Words with Digits",
        description: "Replace the words zero through ten with their digits.",
        run: (input) =>
          input.replace(
            /[\p{L}]+/gu,
            (w) => NUMBER_WORDS[w.toLowerCase()] ?? w,
          ),
      },
      {
        slug: "digits-to-words",
        name: "Replace Digits with Words",
        description: "Spell each digit as a word, or spell out whole numbers.",
        options: [
          {
            kind: "toggle",
            key: "spoken",
            label: "Spoken per digit",
            default: true,
          },
        ],
        run: (input, o) => {
          if (o.spoken !== false) {
            return input.replace(/\d/g, (d) => toWords(Number(d)));
          }
          return input.replace(/\d+/g, (num) => {
            const n = Number(num);
            if (Number.isFinite(n) && n < 100000) return toWords(n);
            return [...num].map((d) => toWords(Number(d))).join(" ");
          });
        },
      },
      {
        slug: "duplicate-letters",
        name: "Duplicate Letters in Text",
        description: "Repeat every letter character a chosen number of times.",
        options: [
          {
            kind: "number",
            key: "times",
            label: "Times",
            default: 2,
            min: 1,
            max: 10,
            step: 1,
          },
        ],
        run: (input, o) => {
          const t = Math.max(1, Math.floor(Number(o.times ?? 2)));
          return [...input]
            .map((c) => (/\p{L}/u.test(c) ? c.repeat(t) : c))
            .join("");
        },
      },
      {
        slug: "remove-letters",
        name: "Remove Letters from Text",
        description:
          "Remove every character in a letter list (vowels by default).",
        options: [
          {
            kind: "text",
            key: "letters",
            label: "Letters to remove",
            default: "aeiou",
          },
        ],
        run: (input, o) => {
          const set = charSet(String(o.letters ?? "aeiou"), VOWELS);
          if (set.size === 0) return input;
          const re = new RegExp(`[${[...set].map(escClass).join("")}]`, "g");
          return input.replace(re, "");
        },
      },
      {
        slug: "erase-letters-from-words",
        name: "Erase Letters from Words",
        description:
          "Remove characters at 1-based positions inside every word.",
        options: [
          { kind: "text", key: "positions", label: "Positions", default: "1" },
        ],
        run: (input, o) => {
          const pos = new Set(
            String(o.positions ?? "1")
              .split(/[\s,]+/)
              .filter(Boolean)
              .map(Number),
          );
          return input.replace(WORD_RE, (w) =>
            [...w].filter((_c, i) => !pos.has(i + 1)).join(""),
          );
        },
      },
      {
        slug: "erase-words",
        name: "Erase Words from Text",
        description:
          "Remove the Nth word or all words shorter/longer than a length.",
        options: [
          {
            kind: "select",
            key: "mode",
            label: "Mode",
            options: ["positions", "length"],
            default: "positions",
          },
          {
            kind: "number",
            key: "index",
            label: "Word index",
            default: 1,
            min: 1,
            max: 100,
            step: 1,
          },
          {
            kind: "number",
            key: "length",
            label: "Length",
            default: 1,
            min: 1,
            max: 50,
            step: 1,
          },
          {
            kind: "toggle",
            key: "shorter",
            label: "Remove shorter words",
            default: true,
          },
        ],
        run: (input, o) => {
          const mode = String(o.mode ?? "positions");
          const idx = Math.max(1, Math.floor(Number(o.index ?? 1)));
          const len = Math.floor(Number(o.length ?? 1));
          const shorter = o.shorter !== false;
          let n = 0;
          return input.replace(WORD_RE, (w) => {
            if (mode === "positions") return ++n === idx ? "" : w;
            const wl = w.length;
            return shorter ? (wl < len ? "" : w) : wl > len ? "" : w;
          });
        },
      },
    ],
  },
  {
    id: "highlight-visualize",
    title: "Highlighting & Visualization",
    description:
      "Inspect structure and wrap parts of the text in markdown-styled markers.",
    tools: [
      {
        slug: "visualize-text",
        name: "Visualize Text Structure",
        description:
          "Show character, word, line and paragraph summaries as an ASCII diagram.",
        run: (input) => {
          const ws = words(input);
          const names = [...new Set(ws)];
          const ls = toLines(input);
          const ps = paragraphs(input);
          return [
            `chars: ${[...input].length}`,
            `words: ${ws.length}${names.length ? ` (${names.slice(0, 12).join(", ")})` : ""}`,
            `lines: ${ls.length}`,
            `paragraphs: ${ps.length}`,
          ].join("\n");
        },
      },
      {
        slug: "highlight-letters",
        name: "Highlight Letters in Text",
        description: "Wrap every listed letter in ** markers.",
        options: [
          {
            kind: "text",
            key: "letters",
            label: "Letters to highlight",
            default: "aeiou",
          },
        ],
        run: (input, o) => {
          const set = charSet(String(o.letters ?? "aeiou"));
          if (set.size === 0) return input;
          const re = new RegExp(`[${[...set].map(escClass).join("")}]`, "gi");
          return input.replace(re, (m) => `**${m}**`);
        },
      },
      {
        slug: "highlight-words",
        name: "Highlight Words in Text",
        description: "Wrap every matching word token in ** markers.",
        options: [
          {
            kind: "text",
            key: "words",
            label: "Words to highlight",
            default: "hello world",
          },
        ],
        run: (input, o) => {
          const set = new Set(
            String(o.words ?? "hello world")
              .split(/\s+/)
              .filter(Boolean)
              .map((w) => w.toLowerCase()),
          );
          return input.replace(WORD_RE, (w) =>
            set.has(w.toLowerCase()) ? `**${w}**` : w,
          );
        },
      },
      {
        slug: "highlight-patterns",
        name: "Highlight Patterns in Text",
        description: "Wrap every literal or regex pattern match in ** markers.",
        options: [
          { kind: "text", key: "pattern", label: "Pattern", default: "\\d+" },
          {
            kind: "toggle",
            key: "regex",
            label: "Treat as regex",
            default: false,
          },
        ],
        run: (input, o) => {
          const pat = String(o.pattern ?? "\\d+");
          try {
            if (o.regex === true) {
              return input.replace(new RegExp(pat, "gu"), (m) => `**${m}**`);
            }
            const literal = pat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            return input.replace(new RegExp(literal, "g"), (m) => `**${m}**`);
          } catch (e) {
            return (
              "Invalid pattern: " + (e instanceof Error ? e.message : String(e))
            );
          }
        },
      },
      {
        slug: "highlight-sentences",
        name: "Highlight Sentences in Text",
        description: "Prefix every sentence with a marker or a bracket number.",
        options: [
          { kind: "toggle", key: "numbered", label: "Numbered", default: true },
        ],
        run: (input, o) => {
          const numbered = o.numbered !== false;
          return sentences(input)
            .map((s, i) => (numbered ? `[${i + 1}] ${s}` : `> ${s}`))
            .join("\n");
        },
      },
    ],
  },
  {
    id: "vowels-consonants",
    title: "Vowels & Consonants",
    description: "Replace, duplicate or strip vowels and consonants.",
    tools: [
      {
        slug: "replace-vowels",
        name: "Replace Vowels in Text",
        description: "Replace every vowel with a chosen character.",
        options: [
          { kind: "text", key: "replace", label: "Replace with", default: "x" },
        ],
        run: (input, o) =>
          input.replace(/[aeiou]/giu, String(o.replace ?? "x")),
      },
      {
        slug: "duplicate-vowels",
        name: "Duplicate Vowels in Text",
        description: "Repeat every vowel a chosen number of times.",
        options: [
          {
            kind: "number",
            key: "times",
            label: "Times",
            default: 2,
            min: 1,
            max: 10,
            step: 1,
          },
        ],
        run: (input, o) => {
          const t = Math.max(1, Math.floor(Number(o.times ?? 2)));
          return input.replace(/[aeiou]/giu, (v) => v.repeat(t));
        },
      },
      {
        slug: "remove-vowels",
        name: "Remove Vowels from Text",
        description: "Strip all vowels, case-insensitively.",
        run: (input) => input.replace(/[aeiou]/giu, ""),
      },
      {
        slug: "replace-consonants",
        name: "Replace Consonants in Text",
        description: "Replace every consonant with a chosen character.",
        options: [
          { kind: "text", key: "replace", label: "Replace with", default: "x" },
        ],
        run: (input, o) =>
          input.replace(/\p{L}/gu, (c) =>
            /[aeiou]/iu.test(c) ? c : String(o.replace ?? "x"),
          ),
      },
      {
        slug: "duplicate-consonants",
        name: "Duplicate Consonants in Text",
        description: "Repeat every consonant a chosen number of times.",
        options: [
          {
            kind: "number",
            key: "times",
            label: "Times",
            default: 2,
            min: 1,
            max: 10,
            step: 1,
          },
        ],
        run: (input, o) => {
          const t = Math.max(1, Math.floor(Number(o.times ?? 2)));
          return input.replace(/\p{L}/gu, (c) =>
            /[aeiou]/iu.test(c) ? c : c.repeat(t),
          );
        },
      },
      {
        slug: "remove-consonants",
        name: "Remove Consonants from Text",
        description: "Strip consonants and keep only vowels.",
        run: (input) =>
          input.replace(/\p{L}/gu, (c) => (/[aeiou]/iu.test(c) ? c : "")),
      },
    ],
  },
  {
    id: "columns-ngrams",
    title: "Columns & N-grams",
    description:
      "Align text into columns and generate unigrams, bigrams and n-grams.",
    tools: [
      {
        slug: "text-to-columns",
        name: "Convert Text to Nice Columns",
        description:
          "Pad tokens to a fixed width and arrange them in rows of six columns.",
        options: [
          {
            kind: "number",
            key: "width",
            label: "Column width",
            default: 16,
            min: 4,
            max: 60,
            step: 1,
          },
        ],
        run: (input, o) => {
          const width = Math.max(1, Number(o.width ?? 16));
          const items = tokens(input);
          return chunk(items, 6)
            .map((row) =>
              row
                .map((it) => it.padEnd(width))
                .join("")
                .trimEnd(),
            )
            .join("\n");
        },
      },
      {
        slug: "columns-to-text",
        name: "Convert Nice Columns to Text",
        description: "Parse aligned columns back into one item per line.",
        run: (input) =>
          toLines(input)
            .flatMap((l) =>
              l
                .split(/\s{2,}/)
                .map((s) => s.trim())
                .filter(Boolean),
            )
            .join("\n"),
      },
      {
        slug: "text-unigrams",
        name: "Generate Text Unigrams",
        description: "Output one token per line.",
        run: (input) => tokens(input).join("\n"),
      },
      {
        slug: "text-bigrams",
        name: "Generate Text Bigrams",
        description: "Output every sliding pair of adjacent tokens.",
        run: (input) => {
          const ws = tokens(input);
          const out: string[] = [];
          for (let i = 0; i + 1 < ws.length; i++)
            out.push(`${ws[i]} ${ws[i + 1]}`);
          return out.join("\n");
        },
      },
      {
        slug: "text-ngrams",
        name: "Generate Text N-grams",
        description: "Output sliding windows of N words.",
        options: [
          {
            kind: "number",
            key: "size",
            label: "N",
            default: 3,
            min: 2,
            max: 10,
            step: 1,
          },
        ],
        run: (input, o) => {
          const size = Math.max(1, Number(o.size ?? 3));
          const ws = tokens(input);
          const out: string[] = [];
          for (let i = 0; i + size <= ws.length; i++)
            out.push(ws.slice(i, i + size).join(" "));
          return out.join("\n");
        },
      },
      {
        slug: "text-skipgrams",
        name: "Generate Text Skip-grams",
        description:
          "Output groups of N words spaced a chosen number of positions apart.",
        options: [
          {
            kind: "number",
            key: "size",
            label: "Size",
            default: 3,
            min: 2,
            max: 6,
            step: 1,
          },
          {
            kind: "number",
            key: "skip",
            label: "Skip",
            default: 1,
            min: 1,
            max: 10,
            step: 1,
          },
        ],
        run: (input, o) => {
          const size = Math.max(1, Number(o.size ?? 3));
          const skip = Math.max(1, Number(o.skip ?? 1));
          const ws = tokens(input);
          const out: string[] = [];
          const span = (size - 1) * skip;
          for (let i = 0; i + span < ws.length; i++) {
            const g: string[] = [];
            for (let k = 0; k < size; k++) g.push(ws[i + k * skip]);
            out.push(g.join(" "));
          }
          return out.join("\n");
        },
      },
    ],
  },
  {
    id: "misc-encoding",
    title: "Misc & Base-Encoding Conversion",
    description:
      "ASCII art, morse code, complexity statistics and base encodings.",
    tools: [
      {
        slug: "zigzag-text",
        name: "Create ZigZag Text",
        description: "Reverse every other word to create a zigzag rhythm.",
        run: (input) =>
          words(input)
            .map((w, i) => (i % 2 === 1 ? [...w].reverse().join("") : w))
            .join(" "),
      },
      {
        slug: "text-box",
        name: "Draw a Box Around Text",
        description: "Frame the lines of text inside a plus-and-dash box.",
        run: (input) => {
          const ls = toLines(input);
          const w = Math.max(1, ...ls.map((l) => l.length));
          const bar = "+" + "-".repeat(w + 2) + "+";
          return [bar, ...ls.map((l) => `| ${l.padEnd(w)} |`), bar].join("\n");
        },
      },
      {
        slug: "text-to-morse",
        name: "Convert Text to Morse Code",
        description:
          "Encode the text into morse code, slash-separated between words.",
        run: (input) => textToMorse(input),
      },
      {
        slug: "morse-to-text",
        name: "Convert Morse Code to Text",
        description: "Decode morse code back into plain text.",
        run: (input) => morseToText(input),
      },
      {
        slug: "text-complexity",
        name: "Calculate Text Complexity",
        description:
          "Report length, entropy and a weighted complexity score out of 100.",
        run: (input) => {
          const chars = [...input].length;
          const ws = words(input);
          const meanW = ws.length ? [...ws].join("").length / ws.length : 0;
          const ent = shannonEntropy(input);
          const score = Math.min(
            100,
            Math.round(chars * 0.3 + ws.length * 2 + meanW * 3 + ent * 5),
          );
          return [
            `Characters: ${chars}`,
            `Words: ${ws.length}`,
            `Mean word length: ${meanW.toFixed(1)}`,
            `Entropy: ${ent.toFixed(2)}`,
            `Complexity score: ${score}/100`,
          ].join("\n");
        },
      },
      {
        slug: "text-to-binary",
        name: "Convert Text to Binary",
        description: "Encode each character as 8-bit binary, space separated.",
        run: (input) =>
          [...input]
            .map((c) => c.charCodeAt(0).toString(2).padStart(8, "0"))
            .join(" "),
      },
      {
        slug: "binary-to-text",
        name: "Convert Binary to Text",
        description:
          "Decode space-separated binary chunks back into characters.",
        run: (input) =>
          input
            .split(/\s+/)
            .filter((p) => /^[01]+$/.test(p))
            .map((p) => String.fromCharCode(parseInt(p, 2)))
            .join(""),
      },
      {
        slug: "text-to-octal",
        name: "Convert Text to Octal",
        description: "Encode each character as padded octal, space separated.",
        run: (input) =>
          [...input]
            .map((c) => c.charCodeAt(0).toString(8).padStart(3, "0"))
            .join(" "),
      },
      {
        slug: "octal-to-text",
        name: "Convert Octal to Text",
        description:
          "Decode space-separated octal chunks back into characters.",
        run: (input) =>
          input
            .split(/\s+/)
            .filter((p) => /^[0-7]+$/.test(p))
            .map((p) => String.fromCharCode(parseInt(p, 8)))
            .join(""),
      },
      {
        slug: "text-to-decimal",
        name: "Convert Text to Decimal",
        description:
          "Encode each character as its decimal code unit, space separated.",
        run: (input) =>
          [...input].map((c) => String(c.charCodeAt(0))).join(" "),
      },
      {
        slug: "decimal-to-text",
        name: "Convert Decimal to Text",
        description:
          "Decode space-separated decimal code units back into characters.",
        run: (input) =>
          input
            .split(/\s+/)
            .filter((p) => /^\d+$/.test(p))
            .map((p) => String.fromCharCode(Number(p)))
            .join(""),
      },
      {
        slug: "text-to-hex",
        name: "Convert Text to Hex",
        description:
          "Encode text as UTF-8 hex bytes by default, or per-code-unit hex.",
        options: [
          { kind: "toggle", key: "utf8", label: "UTF-8 bytes", default: true },
        ],
        run: (input, o) => {
          if (o.utf8 !== false && typeof TextEncoder !== "undefined") {
            return [...new TextEncoder().encode(input)]
              .map((b) => b.toString(16).padStart(2, "0"))
              .join(" ");
          }
          return [...input]
            .map((c) => c.charCodeAt(0).toString(16).padStart(4, "0"))
            .join(" ");
        },
      },
      {
        slug: "hex-to-text",
        name: "Convert Hex to Text",
        description:
          "Decode two-digit hex bytes as UTF-8, or hex code units otherwise.",
        run: (input) => {
          const parts = input
            .trim()
            .split(/\s+/)
            .filter((p) => /^[0-9a-fA-F]+$/.test(p));
          if (parts.length === 0) return "";
          if (parts.every((p) => p.length === 2)) {
            const bytes = parts.map((p) => parseInt(p, 16));
            try {
              return new TextDecoder().decode(new Uint8Array(bytes));
            } catch {
              return String.fromCharCode(...bytes);
            }
          }
          return parts
            .map((p) => String.fromCharCode(parseInt(p, 16)))
            .join("");
        },
      },
    ],
  },
];
