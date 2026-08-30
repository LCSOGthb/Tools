// UTF-8 utilities — pure byte-level helpers.

export interface Utf8Byte {
  offset: number;
  byte: number;
  hex: string;
  dec: number;
  binary: string;
}

export function textToUtf8Bytes(text: string): Utf8Byte[] {
  const bytes = new TextEncoder().encode(text);
  return Array.from(bytes).map((byte, offset) => ({
    offset,
    byte,
    hex: byte.toString(16).padStart(2, "0"),
    dec: byte,
    binary: byte.toString(2).padStart(8, "0"),
  }));
}

export function utf8BytesToText(bytes: ArrayLike<number>): string {
  return new TextDecoder().decode(new Uint8Array(bytes));
}

export function textToCodepoints(text: string): Array<{
  char: string;
  codepoint: number;
  hex: string;
  utf8: string;
  html: string;
  js: string;
}> {
  return Array.from(text).map((char) => {
    const hex = char.codePointAt(0)!;
    const utf8 = textToUtf8Bytes(char)
      .map((b) => b.hex)
      .join(" ");
    return {
      char,
      codepoint: hex,
      hex: `U+${hex.toString(16).toUpperCase().padStart(4, "0")}`,
      utf8,
      html: `&#${hex};`,
      js: `\\u{${hex.toString(16)}}`,
    };
  });
}

export interface Utf8Validation {
  valid: boolean;
  problems: Array<{ offset: number; reason: string; length: number }>;
}

export function validateUtf8(input: string): Utf8Validation {
  let bytes: number[];
  const hexish = /^(?:[0-9a-fA-F]{2}\s*)+$/.test(input.trim());
  if (hexish) {
    bytes = input
      .trim()
      .split(/\s+/)
      .map((h) => parseInt(h, 16));
  } else {
    bytes = Array.from(new TextEncoder().encode(input));
  }
  const problems: Utf8Validation["problems"] = [];
  let i = 0;
  const fail = (offset: number, reason: string, length = 1): Utf8Validation => {
    problems.push({ offset, reason, length });
    return { valid: false, problems };
  };
  while (i < bytes.length) {
    const b = bytes[i];
    if (b <= 0x7f) {
      i++;
      continue;
    }
    if (b >= 0xc2 && b <= 0xdf) {
      if (i + 1 >= bytes.length || (bytes[i + 1] & 0xc0) !== 0x80)
        return fail(i, "Invalid continuation byte", 1);
      i += 2;
      continue;
    }
    if (b >= 0xe0 && b <= 0xef) {
      if (
        i + 2 >= bytes.length ||
        (bytes[i + 1] & 0xc0) !== 0x80 ||
        (bytes[i + 2] & 0xc0) !== 0x80
      )
        return fail(i, "Incomplete multi-byte sequence", 1);
      if (b === 0xe0 && bytes[i + 1] < 0xa0)
        return fail(i, "Overlong encoding", 2);
      if (b === 0xed && bytes[i + 1] > 0x9f)
        return fail(i, "Surrogate in UTF-8", 2);
      i += 3;
      continue;
    }
    if (b >= 0xf0 && b <= 0xf4) {
      if (
        i + 3 >= bytes.length ||
        (bytes[i + 1] & 0xc0) !== 0x80 ||
        (bytes[i + 2] & 0xc0) !== 0x80 ||
        (bytes[i + 3] & 0xc0) !== 0x80
      )
        return fail(i, "Incomplete multi-byte sequence", 1);
      if (b === 0xf0 && bytes[i + 1] < 0x90)
        return fail(i, "Overlong encoding", 3);
      if (b > 0xf4 || (b === 0xf4 && bytes[i + 1] > 0x8f))
        return fail(i, "Code point above U+10FFFF", 3);
      i += 4;
      continue;
    }
    return fail(i, "Unexpected byte (not a valid UTF-8 lead byte)", 1);
  }
  return { valid: problems.length === 0, problems };
}

export function addBom(text: string): string {
  return "\uFEFF" + text;
}

export function removeBom(text: string): string {
  return text.startsWith("\uFEFF") ? text.slice(1) : text;
}

export function detectBom(text: string): boolean {
  return text.startsWith("\uFEFF");
}

export function escapeSequences(
  text: string,
  mode: "unicode" | "hex" | "raw",
): string {
  return Array.from(text)
    .map((ch) => {
      const cp = ch.codePointAt(0)!;
      switch (mode) {
        case "unicode":
          return cp > 0x7f || ch === "\\" ? `\\u{${cp.toString(16)}}` : ch;
        case "hex":
          return cp > 0x7f ? `\\x${cp.toString(16).padStart(4, "0")}` : ch;
        case "raw":
          return ch
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"')
            .replace(/\n/g, "\\n")
            .replace(/\t/g, "\\t")
            .replace(/\r/g, "\\r");
      }
    })
    .join("");
}

export function unescapeSequences(text: string): string {
  const unicode = text.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) =>
    String.fromCodePoint(parseInt(hex, 16)),
  );
  const hex4 = unicode.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
  const hex2 = hex4.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
  return hex2
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r")
    .replace(/\\\\/g, "\\");
}
