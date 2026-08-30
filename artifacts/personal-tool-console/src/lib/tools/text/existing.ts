import type { TextToolGroup } from "./types";

const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
  "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
  "deserunt", "mollit", "anim", "id", "est", "laborum",
];

function loremParagraphs(count: number, wordsPer: number, rand: () => number) {
  const out: string[] = [];
  for (let p = 0; p < count; p++) {
    const parts: string[] = [];
    const n = Math.max(8, Math.round(wordsPer * (0.8 + rand() * 0.4)));
    for (let i = 0; i < n; i++) parts.push(LOREM_WORDS[Math.floor(rand() * LOREM_WORDS.length)]);
    const sentence = parts.join(" ");
    out.push(sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".");
  }
  return out.join("\n\n");
}

export const texts: TextToolGroup[] = [
  {
    id: "existing",
    title: "Classic text tools",
    description: "Existing generators and text utilities kept alongside the expansion.",
    tools: [
      {
        slug: "lorem-ipsum",
        name: "Lorem Ipsum Generator",
        description: "Generate classic dummy Latin filler text.",
        options: [
          { kind: "number", key: "paragraphs", label: "Paragraphs", default: 4, min: 1, max: 50, step: 1 },
          { kind: "number", key: "words", label: "Words per paragraph", default: 24, min: 4, max: 200, step: 1 },
        ],
        run: (_input, o) => {
          const p = Number(o.paragraphs ?? 4);
          const w = Number(o.words ?? 24);
          return loremParagraphs(p, w, Math.random);
        },
      },
      {
        slug: "letter-counter",
        name: "Letter Counter",
        description: "Count characters, letters, words, sentences and lines instantly.",
        options: [
          { kind: "toggle", key: "caseInsensitive", label: "Case-insensitive", default: true },
        ],
        run: (input, o) => {
          const text = o.caseInsensitive ? input.toLowerCase() : input;
          const letters = (text.match(/[a-z]/g) ?? []).length;
          const digits = (text.match(/[0-9]/g) ?? []).length;
          const spaces = (text.match(/\s/g) ?? []).length;
          const words = (text.match(/[\p{L}\p{N}'-]+/gu) ?? []).length;
          const lines = text.split(/\r\n|\r|\n/).length;
          const sentences = (text.match(/[.!?…]+(?=\s|$)/g) ?? []).length;
          return [
            `Characters: ${input.length}`,
            `Letters: ${letters}`,
            `Digits: ${digits}`,
            `Whitespace: ${spaces}`,
            `Words: ${words}`,
            `Sentences: ${sentences}`,
            `Lines: ${lines}`,
          ].join("\n");
        },
      },
      {
        slug: "bionic-reading",
        name: "Bionic Reading",
        description: "Bold the leading characters of every word to help fast reading.",
        options: [
          { kind: "number", key: "bold", label: "Bold letters per word", default: 2, min: 1, max: 6, step: 1 },
        ],
        run: (input, o) => {
          const n = Number(o.bold ?? 2);
          return input.replace(/[\p{L}\p{N}'-]+/gu, (w) => {
            const count = Math.min(n, w.length);
            return `${w.slice(0, count).toUpperCase()}${w.slice(count)}`;
          });
        },
      },
      {
        slug: "whitespace-remover",
        name: "Multiple Whitespace Remover",
        description: "Collapse runs of whitespace down to a single space.",
        run: (input) => input.replace(/\s+/g, " ").trim(),
      },
    ],
  },
];