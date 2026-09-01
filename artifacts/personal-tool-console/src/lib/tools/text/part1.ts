import type { TextOpts, TextToolGroup } from "./types";
import {
  words,
  sentences,
  paragraphs,
  shuffle,
  toLines,
  tokens,
  unique,
  randInt,
  pick,
  frequencies,
  shannonEntropy,
  ALPHABET,
} from "./helpers";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const TEXT_PART1: TextToolGroup[] = [
  {
    id: "split-combine",
    title: "Split & Combine",
    description: "Break text apart or put it back together",
    tools: [
      {
        slug: "split-text",
        name: "Split Text",
        description: "Break text into items by a chosen separator",
        options: [
          {
            kind: "select",
            key: "separator",
            label: "Separator",
            options: [
              "Character",
              "Word",
              "Line",
              "Space",
              "Comma",
              "Custom",
              "CustomRegex",
            ],
            default: "Character",
          },
          { kind: "text", key: "custom", label: "Custom", default: "" },
        ],
        run: (input, o) => {
          if (input === "") return "";
          const sep = String(o.separator ?? "Character");
          const custom = String(o.custom ?? "");
          let parts: string[] = [input];
          if (sep === "Character") parts = input.split("");
          else if (sep === "Word") parts = input.split(/\s+/).filter(Boolean);
          else if (sep === "Line") parts = toLines(input);
          else if (sep === "Space") parts = input.split(" ");
          else if (sep === "Comma") parts = input.split(",");
          else if (sep === "Custom") parts = input.split(custom);
          else if (sep === "CustomRegex")
            parts = input.split(new RegExp(custom));
          return parts.join("\n");
        },
      },
      {
        slug: "join-text",
        name: "Join Text",
        description: "Join lines or words with a separator",
        options: [
          {
            kind: "select",
            key: "parts",
            label: "Parts",
            options: ["Lines", "Words"],
            default: "Lines",
          },
          { kind: "text", key: "separator", label: "Separator", default: ", " },
        ],
        run: (input, o) => {
          const separator = String(o.separator ?? ", ");
          const parts =
            String(o.parts ?? "Lines") === "Words"
              ? tokens(input)
              : toLines(input);
          return parts.join(separator);
        },
      },
      {
        slug: "repeat-text",
        name: "Repeat Text",
        description: "Repeat the whole text a number of times",
        options: [
          { kind: "number", key: "count", label: "Count", default: 3, min: 1 },
        ],
        run: (input, o) => {
          if (input === "") return "";
          const count = Math.max(1, Number(o.count ?? 3) || 1);
          return Array.from({ length: count }, () => input).join("\n");
        },
      },
      {
        slug: "reverse-text",
        name: "Reverse Text",
        description: "Reverse every character of the input",
        run: (input) => [...input].reverse().join(""),
      },
      {
        slug: "truncate-text",
        name: "Truncate Text",
        description: "Cut the text down to N characters",
        options: [
          { kind: "number", key: "length", label: "Length", default: 100 },
          { kind: "toggle", key: "ellipsis", label: "Ellipsis", default: true },
        ],
        run: (input, o) => {
          const len = Math.max(0, Number(o.length ?? 100) || 0);
          if (input.length <= len) return input;
          return input.slice(0, len) + (o.ellipsis === true ? "…" : "");
        },
      },
      {
        slug: "slice-text",
        name: "Slice Text",
        description: "Extract a range of characters by index",
        options: [
          { kind: "number", key: "start", label: "Start", default: 0 },
          { kind: "number", key: "end", label: "End", default: 100 },
        ],
        run: (input, o) => {
          const start = Math.max(0, Number(o.start ?? 0) || 0);
          const end = Number(o.end ?? 100);
          if (!Number.isFinite(end) || end <= 0) return input.slice(start);
          return input.slice(start, end);
        },
      },
    ],
  },
  {
    id: "alignment-padding",
    title: "Alignment & Padding",
    description: "Trim, pad, indent and align text lines",
    tools: [
      {
        slug: "trim-text",
        name: "Trim Text",
        description: "Trim leading and trailing whitespace",
        run: (input) => input.trim(),
      },
      {
        slug: "left-pad-text",
        name: "Left-pad Text",
        description: "Pad every line on the left to a width",
        options: [
          { kind: "number", key: "width", label: "Width", default: 20 },
          { kind: "text", key: "fill", label: "Fill", default: " " },
        ],
        run: (input, o) => {
          const width = Math.max(0, Number(o.width ?? 20) || 0);
          const fill = String(o.fill ?? " ");
          return toLines(input)
            .map((l) => l.padStart(width, fill))
            .join("\n");
        },
      },
      {
        slug: "right-pad-text",
        name: "Right-pad Text",
        description: "Pad every line on the right to a width",
        options: [
          { kind: "number", key: "width", label: "Width", default: 20 },
          { kind: "text", key: "fill", label: "Fill", default: " " },
        ],
        run: (input, o) => {
          const width = Math.max(0, Number(o.width ?? 20) || 0);
          const fill = String(o.fill ?? " ");
          return toLines(input)
            .map((l) => l.padEnd(width, fill))
            .join("\n");
        },
      },
      {
        slug: "left-align-text",
        name: "Left-align Text",
        description: "Strip leading whitespace from each line",
        run: (input) =>
          toLines(input)
            .map((l) => l.replace(/^\s+/, ""))
            .join("\n"),
      },
      {
        slug: "right-align-text",
        name: "Right-align Text",
        description: "Align each line so the right edges match",
        run: (input) => {
          const lines = toLines(input).map((l) => l.replace(/^\s+/, ""));
          const width = Math.max(...lines.map((l) => l.length), 0);
          return lines.map((l) => l.padStart(width)).join("\n");
        },
      },
      {
        slug: "center-text",
        name: "Center Text",
        description: "Center each line within the longest line",
        run: (input) => {
          const lines = toLines(input);
          const width = Math.max(...lines.map((l) => l.length), 0);
          return lines
            .map((l) => {
              const extra = width - l.length;
              if (extra <= 0) return l;
              const left = Math.floor(extra / 2);
              return " ".repeat(left) + l + " ".repeat(extra - left);
            })
            .join("\n");
        },
      },
      {
        slug: "indent-text",
        name: "Indent Text",
        description: "Prefix every line with spaces or a tab",
        options: [
          { kind: "number", key: "spaces", label: "Spaces", default: 4 },
          { kind: "toggle", key: "tabs", label: "Use tabs", default: false },
        ],
        run: (input, o) => {
          const pad =
            o.tabs === true
              ? "\t"
              : " ".repeat(Math.max(0, Number(o.spaces ?? 4) || 0));
          return toLines(input)
            .map((l) => (l === "" ? l : pad + l))
            .join("\n");
        },
      },
      {
        slug: "unindent-text",
        name: "Unindent Text",
        description: "Remove the common leading indentation from lines",
        options: [
          { kind: "number", key: "spaces", label: "Spaces", default: 0 },
        ],
        run: (input, o) => {
          const lines = toLines(input);
          let amount = Number(o.spaces ?? 0) || 0;
          if (amount <= 0) {
            let min = Infinity;
            for (const l of lines) {
              if (l.trim() === "") continue;
              min = Math.min(min, l.match(/^\s*/)?.[0].length ?? 0);
            }
            amount = min === Infinity ? 0 : min;
          }
          return lines.map((l) => l.slice(amount)).join("\n");
        },
      },
      {
        slug: "justify-text",
        name: "Justify Text",
        description: "Stretch spaces so each line fills full width",
        run: (input) => {
          const lines = toLines(input);
          const width = Math.max(...lines.map((l) => l.length), 0);
          return lines
            .map((line) => {
              const ws = line.split(/\s+/).filter(Boolean);
              if (ws.length <= 1) return line;
              const curLen = ws.join(" ").length;
              const gaps = ws.length - 1;
              const extra = width - curLen;
              if (extra <= 0) return line;
              const per = Math.floor(extra / gaps);
              const rem = extra % gaps;
              let out = "";
              ws.forEach((w, i) => {
                out += w;
                if (i < gaps) out += " ".repeat(2 + per + (i < rem ? 1 : 0));
              });
              return out;
            })
            .join("\n");
        },
      },
      {
        slug: "wrap-words",
        name: "Wrap Words",
        description: "Hard wrap the text at a column width",
        options: [
          { kind: "number", key: "width", label: "Width", default: 40 },
        ],
        run: (input, o) => {
          const width = Math.max(1, Number(o.width ?? 40) || 1);
          const out: string[] = [];
          let cur = "";
          for (const w of tokens(input)) {
            if (cur === "") cur = w;
            else if (cur.length + 1 + w.length <= width) cur += " " + w;
            else {
              out.push(cur);
              cur = w;
            }
          }
          if (cur !== "") out.push(cur);
          return out.join("\n");
        },
      },
      {
        slug: "unwrap-text-lines",
        name: "Unwrap Text Lines",
        description: "Join consecutive lines while preserving paragraph breaks",
        run: (input) => {
          const paras: string[] = [];
          let cur: string[] = [];
          for (const l of toLines(input)) {
            const t = l.trim();
            if (t === "") {
              if (cur.length) {
                paras.push(cur.join(" "));
                cur = [];
              }
            } else cur.push(t);
          }
          if (cur.length) paras.push(cur.join(" "));
          return paras.join("\n\n");
        },
      },
    ],
  },
  {
    id: "reordering",
    title: "Reordering Words / Sentences / Paragraphs",
    description: "Reverse, swap and duplicate units of text",
    tools: [
      {
        slug: "reverse-words",
        name: "Reverse Words in Text",
        description: "Reverse the order of words without reversing letters",
        run: (input) => {
          const parts = input.match(/[\p{L}\p{N}'-]+|\s+|./gu) ?? [];
          const wordTokens = parts.filter((p) => /^[\p{L}\p{N}'-]+$/u.test(p));
          wordTokens.reverse();
          let i = 0;
          return parts
            .map((p) => (/^[\p{L}\p{N}'-]+$/u.test(p) ? wordTokens[i++] : p))
            .join("");
        },
      },
      {
        slug: "reverse-sentences",
        name: "Reverse Sentences in Text",
        description: "Reverse the order of the sentences",
        run: (input) => sentences(input).reverse().join(" "),
      },
      {
        slug: "reverse-paragraphs",
        name: "Reverse Paragraphs in Text",
        description: "Reverse the order of the paragraphs",
        run: (input) => paragraphs(input).reverse().join("\n\n"),
      },
      {
        slug: "swap-letters-in-words",
        name: "Swap Letters in Words",
        description: "Reverse the letters inside every word",
        run: (input) =>
          input.replace(/[\p{L}\p{N}'-]+/gu, (w) => [...w].reverse().join("")),
      },
      {
        slug: "swap-words",
        name: "Swap Words",
        description: "Swap two specified words throughout the text",
        options: [
          { kind: "text", key: "wordA", label: "Word A", default: "world" },
          { kind: "text", key: "wordB", label: "Word B", default: "there" },
        ],
        run: (input, o) => {
          const a = String(o.wordA ?? "world");
          const b = String(o.wordB ?? "there");
          if (!a) return input;
          return input.replace(new RegExp(`\\b${esc(a)}\\b`, "gi"), (m) =>
            [...b]
              .map((ch, k) => {
                const ref = m[k] ?? m[m.length - 1];
                return ref && ref === ref.toUpperCase()
                  ? ch.toUpperCase()
                  : ch.toLowerCase();
              })
              .join(""),
          );
        },
      },
      {
        slug: "duplicate-words",
        name: "Duplicate Words",
        description: "Repeat every word a number of times",
        options: [{ kind: "number", key: "times", label: "Times", default: 2 }],
        run: (input, o) => {
          const times = Math.max(1, Number(o.times ?? 2) || 1);
          return input.replace(/\S+/g, (w) =>
            Array.from({ length: times }, () => w).join(" "),
          );
        },
      },
      {
        slug: "remove-words",
        name: "Remove Words",
        description: "Remove listed words or a positional range",
        options: [
          { kind: "text", key: "words", label: "Words", default: "" },
          { kind: "number", key: "from", label: "From", default: 0 },
          { kind: "number", key: "to", label: "To", default: 0 },
        ],
        run: (input, o) => {
          const list = String(o.words ?? "")
            .split(",")
            .map((s) => s.toLowerCase())
            .filter(Boolean);
          if (list.length) {
            return words(input)
              .filter((w) => !list.includes(w.toLowerCase()))
              .join(" ");
          }
          const ws = words(input);
          const from = Math.max(0, Number(o.from ?? 0) || 0);
          const to = Math.max(0, Number(o.to ?? 0) || 0);
          const end = to <= 0 ? ws.length : to;
          return [...ws.slice(0, from), ...ws.slice(end)].join(" ");
        },
      },
      {
        slug: "duplicate-sentences",
        name: "Duplicate Sentences",
        description: "Repeat each sentence a number of times",
        options: [{ kind: "number", key: "times", label: "Times", default: 2 }],
        run: (input, o) => {
          const times = Math.max(1, Number(o.times ?? 2) || 1);
          return sentences(input)
            .flatMap((s) => Array.from({ length: times }, () => s))
            .join(" ");
        },
      },
      {
        slug: "remove-sentences",
        name: "Remove Sentences",
        description: "Remove sentences by their one-based positions",
        options: [
          { kind: "text", key: "indexes", label: "Indexes", default: "" },
        ],
        run: (input, o) => {
          const idx = String(o.indexes ?? "")
            .split(",")
            .map((s) => parseInt(s, 10))
            .filter((n) => Number.isFinite(n));
          return sentences(input)
            .filter((_, i) => !idx.includes(i + 1))
            .join(" ");
        },
      },
      {
        slug: "replace-words",
        name: "Replace Words",
        description: "Replace occurrences of one word with another",
        options: [
          { kind: "text", key: "find", label: "Find", default: "foo" },
          { kind: "text", key: "replace", label: "Replace", default: "bar" },
          {
            kind: "toggle",
            key: "caseInsensitive",
            label: "Case-insensitive",
            default: true,
          },
        ],
        run: (input, o) => {
          const find = String(o.find ?? "foo");
          const replace = String(o.replace ?? "bar");
          if (!find) return input;
          return input.replace(
            new RegExp(esc(find), o.caseInsensitive === true ? "gi" : "g"),
            replace,
          );
        },
      },
    ],
  },
  {
    id: "randomize-fake",
    title: "Randomization & Fake Text",
    description: "Generate, inject and detect dummy text",
    tools: [
      {
        slug: "add-random-words",
        name: "Add Random Words",
        description: "Insert random filler words at random positions",
        options: [{ kind: "number", key: "count", label: "Count", default: 3 }],
        run: (input, o) => {
          if (input === "") return "";
          const count = Math.max(1, Number(o.count ?? 3) || 1);
          const pool = [
            "um",
            "actually",
            "basically",
            "literally",
            "very",
            "really",
            "sort of",
          ];
          const toks = input.match(/\S+|\s+/g) ?? [];
          for (let i = 0; i < count; i++) {
            const pos = randInt(0, toks.length);
            const before = pos > 0 && toks[pos - 1]?.trim() !== "" ? " " : "";
            const after =
              pos < toks.length && toks[pos]?.trim() !== "" ? " " : "";
            toks.splice(pos, 0, before + pick(pool) + after);
          }
          return toks.join("");
        },
      },
      {
        slug: "add-random-letters",
        name: "Add Random Letters to Words",
        description: "Insert random letters inside random words",
        options: [{ kind: "number", key: "count", label: "Count", default: 1 }],
        run: (input, o) => {
          if (input === "") return "";
          const count = Math.max(1, Number(o.count ?? 1) || 1);
          const parts = input.match(/\S+|\s+/g) ?? [];
          const wordIdx = parts
            .map((p, i) => (p.trim() ? i : -1))
            .filter((i) => i >= 0);
          for (let i = 0; i < count && wordIdx.length; i++) {
            const ti = pick(wordIdx);
            const w = parts[ti];
            const at = randInt(0, w.length);
            parts[ti] =
              w.slice(0, at) +
              ALPHABET[randInt(0, ALPHABET.length - 1)] +
              w.slice(at);
          }
          return parts.join("");
        },
      },
      {
        slug: "introduce-errors",
        name: "Introduce Errors in Text",
        description: "Randomly replace characters or swap adjacent ones",
        options: [
          { kind: "number", key: "rate", label: "Rate (%)", default: 5 },
          {
            kind: "toggle",
            key: "swap",
            label: "Swap adjacent letters",
            default: false,
          },
        ],
        run: (input, o) => {
          const rate = Math.max(0, Number(o.rate ?? 5) || 0);
          const swap = o.swap === true;
          const chars = [...input];
          for (let i = 0; i < chars.length; i++) {
            if (Math.random() * 100 < rate) {
              if (swap && i + 1 < chars.length) {
                [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
                i++;
              } else {
                chars[i] = ALPHABET[randInt(0, ALPHABET.length - 1)];
              }
            }
          }
          return chars.join("");
        },
      },
      {
        slug: "generate-fake-text",
        name: "Generate Fake Text",
        description: "Produce plausible dummy prose paragraphs",
        options: [
          {
            kind: "number",
            key: "paragraphs",
            label: "Paragraphs",
            default: 3,
          },
        ],
        run: (input, o) => {
          const n = Math.max(1, Number(o.paragraphs ?? 3) || 1);
          const pool = [
            "the",
            "quick",
            "brown",
            "fox",
            "jumps",
            "over",
            "lazy",
            "dog",
            "stream",
            "light",
            "data",
            "cloud",
            "value",
            "system",
            "user",
            "table",
            "signal",
            "token",
            "query",
          ];
          const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
          const sentence = () =>
            Array.from({ length: randInt(7, 12) }, () => pick(pool)).join(" ") +
            ".";
          const out: string[] = [];
          for (let i = 0; i < n; i++) {
            const sents: string[] = [];
            for (let j = 0, m = randInt(3, 6); j < m; j++)
              sents.push(cap(sentence()));
            out.push(sents.join(" "));
          }
          return out.join("\n\n");
        },
      },
      {
        slug: "unfake-text",
        name: "Unfake Text",
        description: "Strip common lorem ipsum filler words",
        run: (input) => {
          const filler = [
            "lorem",
            "ipsum",
            "dolor",
            "sit",
            "amet",
            "consectetur",
            "adipiscing",
            "elit",
          ];
          return tokens(input)
            .filter(
              (w) =>
                !filler.includes(
                  w.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase(),
                ),
            )
            .join(" ");
        },
      },
      {
        slug: "check-fake-text",
        name: "Check If Text Is Fake",
        description: "Heuristically score how dummy the text looks",
        run: (input) => {
          const filler = [
            "lorem",
            "ipsum",
            "blah",
            "test",
            "foo",
            "bar",
            "asd",
            "qwerty",
            "placeholder",
            "sample",
          ];
          const counts = new Map<string, number>();
          for (const w of tokens(input)) {
            const base = w.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
            if (filler.includes(base))
              counts.set(base, (counts.get(base) ?? 0) + 1);
          }
          let score = Math.min(
            40,
            [...counts.values()].reduce((a, b) => a + b, 0) * 10,
          );
          const wds = words(input);
          const avgLen = wds.length ? wds.join("").length / wds.length : 0;
          if (avgLen < 3.5) score += 20;
          if (/lorem[\s]+ipsum/i.test(input)) score += 20;
          score = Math.min(100, score);
          const matches = [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([w, c]) => `${w} (${c})`)
            .join(", ");
          return [
            `Dummy score: ${score}/100`,
            matches ? `Matches: ${matches}` : "Matches: none",
          ].join("\n");
        },
      },
      {
        slug: "remove-random-letters",
        name: "Remove Random Letters",
        description: "Delete a number of random letters from words",
        options: [{ kind: "number", key: "count", label: "Count", default: 3 }],
        run: (input, o) => {
          const count = Math.max(0, Number(o.count ?? 3) || 0);
          if (count <= 0) return input;
          const parts: string[] = input.match(/\S+|\s+/g) ?? [];
          const byTok = new Map<number, number[]>();
          parts.forEach((p, ti) => {
            if (!p.trim()) return;
            byTok.set(
              ti,
              [...p]
                .map((c, ci) => (/\p{L}/u.test(c) ? ci : -1))
                .filter((i) => i >= 0),
            );
          });
          const all: Array<[number, number]> = [];
          for (const [ti, arr] of byTok)
            for (const ci of arr) all.push([ti, ci]);
          const chosen = new Map<number, number[]>();
          for (const [ti, ci] of shuffle(all).slice(0, count)) {
            const arr = chosen.get(ti) ?? [];
            arr.push(ci);
            chosen.set(ti, arr);
          }
          for (const [ti, indices] of chosen) {
            indices.sort((a, b) => b - a);
            for (const ci of indices)
              parts[ti] = parts[ti].slice(0, ci) + parts[ti].slice(ci + 1);
          }
          return parts.join("");
        },
      },
      {
        slug: "remove-random-symbols",
        name: "Remove Random Symbols",
        description: "Delete random punctuation and symbol characters",
        options: [{ kind: "number", key: "count", label: "Count", default: 5 }],
        run: (input, o) => {
          const count = Math.max(0, Number(o.count ?? 5) || 0);
          if (count <= 0) return input;
          const chars = [...input];
          const symIdx = chars
            .map((c, i) => (!/[\p{L}\p{N}\s]/u.test(c) ? i : -1))
            .filter((i) => i >= 0);
          for (const i of shuffle(symIdx)
            .slice(0, count)
            .sort((a, b) => b - a))
            chars[i] = "";
          return chars.join("");
        },
      },
      {
        slug: "scramble-words",
        name: "Scramble Words",
        description: "Shuffle the letters inside every word",
        run: (input) =>
          input.replace(/[\p{L}\p{N}'-]+/gu, (w) => shuffle([...w]).join("")),
      },
    ],
  },
  {
    id: "prefix-suffix-symbols",
    title: "Symbols, Prefixes & Suffixes",
    description: "Wrap words or lines with symbols and markers",
    tools: [
      {
        slug: "add-symbols-around-words",
        name: "Add Symbols Around Words",
        description: "Wrap every word with a symbol pair",
        options: [
          { kind: "text", key: "left", label: "Left", default: "[" },
          { kind: "text", key: "right", label: "Right", default: "]" },
        ],
        run: (input, o) => {
          const left = String(o.left ?? "[");
          const right = String(o.right ?? "]");
          return input.replace(/[\p{L}\p{N}'-]+/gu, (w) => left + w + right);
        },
      },
      {
        slug: "remove-symbols-around-words",
        name: "Remove Symbols from Around Words",
        description: "Strip matching symbols from around every word",
        options: [
          { kind: "text", key: "left", label: "Left", default: "[" },
          { kind: "text", key: "right", label: "Right", default: "]" },
        ],
        run: (input, o) => {
          const left = String(o.left ?? "[");
          const right = String(o.right ?? "]");
          return input.replace(/\S+/g, (w) =>
            w
              .replace(new RegExp(`^${esc(left)}`), "")
              .replace(new RegExp(`${esc(right)}$`), ""),
          );
        },
      },
      {
        slug: "add-prefix-lines",
        name: "Add a Prefix to Text Lines",
        description: "Prefix every line with a marker string",
        options: [
          { kind: "text", key: "prefix", label: "Prefix", default: "> " },
        ],
        run: (input, o) => {
          const prefix = String(o.prefix ?? "> ");
          return toLines(input)
            .map((l) => prefix + l)
            .join("\n");
        },
      },
      {
        slug: "add-suffix-lines",
        name: "Add a Suffix to Text Lines",
        description: "Append a suffix to every line",
        options: [
          { kind: "text", key: "suffix", label: "Suffix", default: " <" },
        ],
        run: (input, o) => {
          const suffix = String(o.suffix ?? " <");
          return toLines(input)
            .map((l) => l + suffix)
            .join("\n");
        },
      },
      {
        slug: "remove-prefix",
        name: "Remove a Prefix from Text",
        description: "Strip a prefix from the start of each line",
        options: [
          { kind: "text", key: "prefix", label: "Prefix", default: "> " },
        ],
        run: (input, o) => {
          const prefix = String(o.prefix ?? "> ");
          return toLines(input)
            .map((l) => (l.startsWith(prefix) ? l.slice(prefix.length) : l))
            .join("\n");
        },
      },
      {
        slug: "remove-suffix-lines",
        name: "Remove a Suffix from Text Lines",
        description: "Strip a suffix from the end of each line",
        options: [
          { kind: "text", key: "suffix", label: "Suffix", default: " <" },
        ],
        run: (input, o) => {
          const suffix = String(o.suffix ?? " <");
          return toLines(input)
            .map((l) =>
              l.endsWith(suffix) ? l.slice(0, l.length - suffix.length) : l,
            )
            .join("\n");
        },
      },
      {
        slug: "add-prefix-words",
        name: "Add a Prefix to Words",
        description: "Prefix every word with a marker string",
        options: [
          { kind: "text", key: "prefix", label: "Prefix", default: "#" },
        ],
        run: (input, o) => {
          const prefix = String(o.prefix ?? "#");
          return input.replace(/[\p{L}\p{N}'-]+/gu, (w) => prefix + w);
        },
      },
      {
        slug: "add-suffix-words",
        name: "Add a Suffix to Words",
        description: "Append a suffix to every word",
        options: [
          { kind: "text", key: "suffix", label: "Suffix", default: "!" },
        ],
        run: (input, o) => {
          const suffix = String(o.suffix ?? "!");
          return input.replace(/[\p{L}\p{N}'-]+/gu, (w) => w + suffix);
        },
      },
      {
        slug: "remove-prefix-words",
        name: "Remove a Prefix from Words",
        description: "Strip a prefix from every word that has it",
        options: [
          { kind: "text", key: "prefix", label: "Prefix", default: "#" },
        ],
        run: (input, o) => {
          const prefix = String(o.prefix ?? "#");
          return input.replace(/\S+/g, (w) =>
            w.startsWith(prefix) ? w.slice(prefix.length) : w,
          );
        },
      },
      {
        slug: "remove-suffix-words",
        name: "Remove a Suffix from Words",
        description: "Strip a suffix from every word that has it",
        options: [
          { kind: "text", key: "suffix", label: "Suffix", default: "!" },
        ],
        run: (input, o) => {
          const suffix = String(o.suffix ?? "!");
          return input.replace(/\S+/g, (w) =>
            w.endsWith(suffix) ? w.slice(0, w.length - suffix.length) : w,
          );
        },
      },
      {
        slug: "insert-symbols-between-letters",
        name: "Insert Symbols Between Letters",
        description: "Insert a symbol between every character",
        options: [
          { kind: "text", key: "symbol", label: "Symbol", default: "-" },
        ],
        run: (input, o) => {
          const symbol = String(o.symbol ?? "-");
          return [...input].join(symbol);
        },
      },
      {
        slug: "add-symbols-around-letters",
        name: "Add Symbols Around Letters",
        description: "Wrap each letter with a symbol pair",
        options: [
          { kind: "text", key: "left", label: "Left", default: "(" },
          { kind: "text", key: "right", label: "Right", default: ")" },
        ],
        run: (input, o) => {
          const left = String(o.left ?? "(");
          const right = String(o.right ?? ")");
          return [...input].map((c) => left + c + right).join("");
        },
      },
    ],
  },
  {
    id: "filtering",
    title: "Filtering",
    description: "Keep or drop lines, words, sentences and paragraphs",
    tools: [
      {
        slug: "remove-empty-lines",
        name: "Remove All Empty Lines",
        description: "Drop every blank line from the text",
        run: (input) =>
          toLines(input)
            .filter((l) => l.trim() !== "")
            .join("\n"),
      },
      {
        slug: "remove-duplicate-lines",
        name: "Remove All Duplicate Lines",
        description: "Keep only the first occurrence of each line",
        run: (input) => {
          const seen = new Set<string>();
          const out: string[] = [];
          for (const l of toLines(input)) {
            if (!seen.has(l)) {
              seen.add(l);
              out.push(l);
            }
          }
          return out.join("\n");
        },
      },
      {
        slug: "filter-lines",
        name: "Filter Text Lines",
        description: "Keep or remove lines by a match string",
        options: [
          {
            kind: "select",
            key: "mode",
            label: "Mode",
            options: ["keep", "remove"],
            default: "keep",
          },
          { kind: "text", key: "match", label: "Match", default: "" },
          { kind: "toggle", key: "regex", label: "Regex", default: false },
        ],
        run: (input, o) => {
          const mode = String(o.mode ?? "keep");
          const match = String(o.match ?? "");
          const keep = mode !== "remove";
          if (match === "")
            return toLines(input)
              .filter((l) => l.trim() !== "")
              .join("\n");
          const re = o.regex === true ? new RegExp(match, "u") : null;
          const hit = (l: string) => (re ? re.test(l) : l.includes(match));
          return toLines(input)
            .filter((l) => (keep ? hit(l) : !hit(l)))
            .join("\n");
        },
      },
      {
        slug: "filter-words",
        name: "Filter Words in Text",
        description: "Keep or drop words equal to a match",
        options: [
          {
            kind: "select",
            key: "mode",
            label: "Mode",
            options: ["keep", "remove"],
            default: "keep",
          },
          { kind: "text", key: "match", label: "Match", default: "" },
        ],
        run: (input, o) => {
          const mode = String(o.mode ?? "keep");
          const match = String(o.match ?? "").toLowerCase();
          const keep = mode !== "remove";
          return words(input)
            .filter((w) =>
              keep ? w.toLowerCase() === match : w.toLowerCase() !== match,
            )
            .join(" ");
        },
      },
      {
        slug: "filter-sentences",
        name: "Filter Sentences",
        description: "Keep or drop sentences containing a match",
        options: [
          {
            kind: "select",
            key: "mode",
            label: "Mode",
            options: ["keep", "remove"],
            default: "keep",
          },
          { kind: "text", key: "match", label: "Match", default: "" },
        ],
        run: (input, o) => {
          const mode = String(o.mode ?? "keep");
          const match = String(o.match ?? "");
          const keep = mode !== "remove";
          return sentences(input)
            .filter((s) => (keep ? s.includes(match) : !s.includes(match)))
            .join(" ");
        },
      },
      {
        slug: "filter-paragraphs",
        name: "Filter Paragraphs",
        description: "Keep or drop paragraphs containing a match",
        options: [
          {
            kind: "select",
            key: "mode",
            label: "Mode",
            options: ["keep", "remove"],
            default: "keep",
          },
          { kind: "text", key: "match", label: "Match", default: "" },
        ],
        run: (input, o) => {
          const mode = String(o.mode ?? "keep");
          const match = String(o.match ?? "");
          const keep = mode !== "remove";
          return paragraphs(input)
            .filter((p) => (keep ? p.includes(match) : !p.includes(match)))
            .join("\n\n");
        },
      },
    ],
  },
  {
    id: "sorting",
    title: "Sorting",
    description: "Sort lines, words, sentences, paragraphs or symbols",
    tools: [
      {
        slug: "sort-lines",
        name: "Sort Text Lines",
        description: "Sort lines alphabetically or naturally",
        options: [
          {
            kind: "select",
            key: "dir",
            label: "Direction",
            options: ["asc", "desc", "natural", "natural-desc"],
            default: "asc",
          },
          {
            kind: "toggle",
            key: "trim",
            label: "Trim before sorting",
            default: false,
          },
        ],
        run: (input, o) => {
          const dir = String(o.dir ?? "asc");
          const collator = new Intl.Collator(undefined, {
            numeric: true,
            sensitivity: "base",
          });
          const lines = toLines(input).map((l) =>
            o.trim === true ? l.trim() : l,
          );
          if (dir === "desc") lines.sort((a, b) => b.localeCompare(a));
          else if (dir === "natural")
            lines.sort((a, b) => collator.compare(a, b));
          else if (dir === "natural-desc")
            lines.sort((a, b) => collator.compare(b, a));
          else lines.sort((a, b) => a.localeCompare(b));
          return lines.join("\n");
        },
      },
      {
        slug: "sort-sentences",
        name: "Sort Sentences in Text",
        description: "Sort the sentences alphabetically and rejoin",
        run: (input) =>
          sentences(input)
            .sort((a, b) => a.localeCompare(b))
            .join(" "),
      },
      {
        slug: "sort-paragraphs",
        name: "Sort Paragraphs",
        description: "Sort the paragraphs alphabetically and rejoin",
        run: (input) =>
          paragraphs(input)
            .sort((a, b) => a.localeCompare(b))
            .join("\n\n"),
      },
      {
        slug: "sort-words",
        name: "Sort Words",
        description: "Sort every word in the text alphabetically",
        options: [
          {
            kind: "toggle",
            key: "dedupe",
            label: "Deduplicate",
            default: true,
          },
        ],
        run: (input, o) => {
          const ws = words(input).sort((a, b) => a.localeCompare(b));
          return (o.dedupe === true ? unique(ws) : ws).join(" ");
        },
      },
      {
        slug: "sort-letters",
        name: "Sort Letters in Words",
        description: "Sort the letters inside every word",
        run: (input) =>
          input.replace(/[\p{L}\p{N}'-]+/gu, (w) =>
            [...w].sort((a, b) => a.localeCompare(b)).join(""),
          ),
      },
      {
        slug: "sort-symbols",
        name: "Sort Symbols in Text",
        description: "Extract and sort all punctuation symbols one per line",
        run: (input) =>
          [...input]
            .filter((c) => /[\p{P}\p{S}]/u.test(c))
            .sort((a, b) => a.localeCompare(b))
            .join("\n"),
      },
    ],
  },
  {
    id: "randomize-order",
    title: "Randomize Order",
    description: "Shuffle the order of text units",
    tools: [
      {
        slug: "randomize-letters",
        name: "Randomize Letters in Text",
        description: "Shuffle letters while keeping non-letters in place",
        run: (input) => {
          const chars = [...input];
          const letters = chars.filter((c) => /[\p{L}]/u.test(c));
          const mixed = shuffle(letters);
          let k = 0;
          return chars
            .map((c) => (/[\p{L}]/u.test(c) ? mixed[k++] : c))
            .join("");
        },
      },
      {
        slug: "randomize-words",
        name: "Randomize Words in Text",
        description: "Shuffle the order of all the words",
        run: (input) => shuffle(tokens(input)).join(" "),
      },
      {
        slug: "randomize-lines",
        name: "Randomize Text Lines",
        description: "Shuffle the order of the lines",
        run: (input) => shuffle(toLines(input)).join("\n"),
      },
      {
        slug: "randomize-sentences",
        name: "Randomize Text Sentences",
        description: "Shuffle the order of the sentences",
        run: (input) => shuffle(sentences(input)).join(" "),
      },
      {
        slug: "randomize-paragraphs",
        name: "Randomize Text Paragraphs",
        description: "Shuffle the order of the paragraphs",
        run: (input) => shuffle(paragraphs(input)).join("\n\n"),
      },
    ],
  },
  {
    id: "stats-structure",
    title: "Statistics & Structure",
    description: "Measure, extract and summarize the text",
    tools: [
      {
        slug: "letter-sum",
        name: "Calculate Letter Sum",
        description: "Sum letter values using a chosen scheme",
        options: [
          {
            kind: "select",
            key: "mode",
            label: "Mode",
            options: ["a1", "a0", "ascii"],
            default: "a1",
          },
          {
            kind: "toggle",
            key: "caseInsensitive",
            label: "Case-insensitive",
            default: true,
          },
        ],
        run: (input, o) => {
          const mode = String(o.mode ?? "a1");
          const ci = o.caseInsensitive === true;
          let sum = 0;
          for (const ch of input) {
            if (!/[\p{L}]/u.test(ch)) continue;
            if (mode === "ascii") {
              sum += ch.charCodeAt(0);
            } else {
              const c = ci ? ch.toLowerCase() : ch;
              const base = /[\p{Lu}]/u.test(c) ? 65 : 97;
              sum += c.charCodeAt(0) - base + (mode === "a1" ? 1 : 0);
            }
          }
          return `Sum: ${sum}`;
        },
      },
      {
        slug: "extract-fragment",
        name: "Extract a Text Fragment",
        description: "Extract the substring between two markers",
        options: [
          { kind: "text", key: "start", label: "Start", default: "[" },
          { kind: "text", key: "end", label: "End", default: "]" },
        ],
        run: (input, o) => {
          const start = String(o.start ?? "[");
          const end = String(o.end ?? "]");
          const s = input.indexOf(start);
          if (s === -1) return "";
          const from = s + start.length;
          const e = input.indexOf(end, from);
          if (e === -1) return "";
          return input.slice(from, e);
        },
      },
      {
        slug: "find-replace",
        name: "Find and Replace Text",
        description: "Replace all occurrences of a string or regex",
        options: [
          { kind: "text", key: "find", label: "Find", default: "" },
          { kind: "text", key: "replace", label: "Replace", default: "" },
          { kind: "toggle", key: "regex", label: "Regex", default: false },
        ],
        run: (input, o) => {
          const find = String(o.find ?? "");
          const replace = String(o.replace ?? "");
          if (find === "") return input;
          return o.regex === true
            ? input.replace(new RegExp(find, "g"), replace)
            : input.replaceAll(find, replace);
        },
      },
      {
        slug: "text-length",
        name: "Find the Length of Text",
        description: "Report character, word and line counts",
        options: [
          { kind: "toggle", key: "words", label: "Words", default: true },
          { kind: "toggle", key: "lines", label: "Lines", default: true },
        ],
        run: (input, o) => {
          const out = [`Characters: ${input.length}`];
          if (o.words !== false) out.push(`Words: ${words(input).length}`);
          if (o.lines !== false) out.push(`Lines: ${toLines(input).length}`);
          return out.join("\n");
        },
      },
      {
        slug: "top-letters",
        name: "Find Top Letters in Text",
        description: "Rank the most frequent letters in the text",
        options: [
          { kind: "number", key: "count", label: "Count", default: 5 },
          {
            kind: "toggle",
            key: "caseInsensitive",
            label: "Case-insensitive",
            default: true,
          },
        ],
        run: (input, o) => {
          const count = Math.max(1, Number(o.count ?? 5) || 1);
          const ci = o.caseInsensitive === true;
          const letters = [...input]
            .filter((c) => /[\p{L}]/u.test(c))
            .map((c) => (ci ? c.toLowerCase() : c));
          return frequencies(letters)
            .slice(0, count)
            .map((e) => `${e.item}: ${e.count}`)
            .join("\n");
        },
      },
      {
        slug: "top-words",
        name: "Find Top Words in Text",
        description: "Rank the most frequent words in the text",
        options: [{ kind: "number", key: "count", label: "Count", default: 5 }],
        run: (input, o) => {
          const count = Math.max(1, Number(o.count ?? 5) || 1);
          return frequencies(words(input))
            .slice(0, count)
            .map((e) => `${e.item}: ${e.count}`)
            .join("\n");
        },
      },
      {
        slug: "text-entropy",
        name: "Calculate Text Entropy",
        description: "Report character count and Shannon entropy",
        run: (input) =>
          [
            `Characters: ${input.length}`,
            `Unique chars: ${new Set(input).size}`,
            `Entropy: ${shannonEntropy(input).toFixed(2)} bits/char`,
          ].join("\n"),
      },
      {
        slug: "count-words",
        name: "Count Words in Text",
        description: "Report total and unique word counts",
        run: (input) => {
          const w = words(input);
          return `Total words: ${w.length}\nUnique words: ${unique(w).length}`;
        },
      },
      {
        slug: "text-stats",
        name: "Print Text Statistics",
        description: "Report a combined set of text measurements",
        run: (input) =>
          [
            `Characters: ${input.length}`,
            `Letters: ${[...input].filter((c) => /[\p{L}]/u.test(c)).length}`,
            `Words: ${words(input).length}`,
            `Sentences: ${sentences(input).length}`,
            `Lines: ${toLines(input).length}`,
            `Paragraphs: ${paragraphs(input).length}`,
          ].join(" / "),
      },
      {
        slug: "unique-words",
        name: "Find Unique Words in Text",
        description: "List the words that appear exactly once",
        run: (input) =>
          frequencies(words(input))
            .filter((e) => e.count === 1)
            .map((e) => e.item)
            .join("\n"),
      },
      {
        slug: "find-duplicate-words",
        name: "Find Duplicate Words",
        description: "List the words that appear more than once",
        run: (input) =>
          frequencies(words(input))
            .filter((e) => e.count > 1)
            .map((e) => e.item)
            .join("\n"),
      },
      {
        slug: "unique-letters",
        name: "Find Unique Letters",
        description: "List the letters that appear exactly once",
        run: (input) =>
          frequencies([...input].filter((c) => /[\p{L}]/u.test(c)))
            .filter((e) => e.count === 1)
            .map((e) => e.item)
            .join("\n"),
      },
      {
        slug: "find-duplicate-letters",
        name: "Find Duplicate Letters",
        description: "List the letters that appear more than once",
        run: (input) =>
          frequencies([...input].filter((c) => /[\p{L}]/u.test(c)))
            .filter((e) => e.count > 1)
            .map((e) => e.item)
            .join("\n"),
      },
      {
        slug: "remove-duplicate-words",
        name: "Remove Duplicate Words",
        description: "Deduplicate words keeping first occurrences in order",
        run: (input) => unique(words(input)).join(" "),
      },
      {
        slug: "count-lines",
        name: "Count Text Lines",
        description: "Report how many lines the text has",
        run: (input) => `Lines: ${toLines(input).length}`,
      },
      {
        slug: "add-line-numbers",
        name: "Add Line Numbers",
        description: "Prefix each non-blank line with its number",
        run: (input) =>
          toLines(input)
            .map((l, i) => (l === "" ? l : `${i + 1}. ${l}`))
            .join("\n"),
      },
      {
        slug: "remove-line-numbers",
        name: "Remove Line Numbers",
        description: "Strip leading number markers from all lines",
        run: (input) =>
          toLines(input)
            .map((l) => l.replace(/^\s*\d+[.:]\s?/, ""))
            .join("\n"),
      },
    ],
  },
];
