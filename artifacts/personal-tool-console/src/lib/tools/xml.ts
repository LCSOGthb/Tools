// XML utilities — uses DOMParser/XMLSerializer available in the browser.

export function parseXml(xml: string): Document {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    const message = parseError.textContent ?? "Invalid XML";
    throw new Error(message.trim().split("\n")[0]);
  }
  return doc;
}

export function formatXml(xml: string, indentSize = 2): string {
  const doc = parseXml(xml);
  let out = "";
  const walk = (node: Node, depth: number) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const value = child.textContent ?? "";
        if (value.trim()) out += " ".repeat(depth) + value.trim() + "\n";
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const el = child as Element;
      const indent = " ".repeat(depth);
      out += indent + `<${el.tagName}`;
      for (const attr of Array.from(el.attributes)) out += ` ${attr.name}="${attr.value}"`;
      if (el.childNodes.length === 0) {
        out += " />\n";
        continue;
      }
      const hasText = Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim());
      if (hasText && el.childNodes.length === 1) {
        out += `>${(el.textContent ?? "").trim()}</${el.tagName}>\n`;
      } else {
        out += ">\n";
        walk(child, depth + 1);
        out += indent + `</${el.tagName}>\n`;
      }
    }
  };
  walk(doc, 0);
  return out.trimEnd() + "\n";
}

export function minifyXml(xml: string, keepComments = false): string {
  const doc = parseXml(xml);
  if (!keepComments) {
    doc.querySelectorAll("*").forEach((el) => {
      el.childNodes.forEach((n) => {
        if (n.nodeType === Node.COMMENT_NODE) n.parentNode?.removeChild(n);
      });
    });
  }
  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc).replace(/>\s+</g, "><").trim();
}

export interface XmlValidationResult {
  valid: boolean;
  line: number;
  column: number;
  error?: string;
}

export function validateXml(xml: string): XmlValidationResult {
  try {
    parseXml(xml);
    return { valid: true, line: -1, column: -1 };
  } catch (err) {
    const message = (err as Error).message;
    const lineMatch = message.match(/line (\d+)/i);
    const colMatch = message.match(/column (\d+)/i);
    const line = lineMatch ? Number(lineMatch[1]) : -1;
    const column = colMatch ? Number(colMatch[1]) : -1;
    return { valid: false, line, column, error: message };
  }
}

interface XmlNode {
  tag: string;
  attributes: Record<string, string>;
  children: XmlNode[];
  text: string;
}

function elementToObject(el: Element): XmlNode {
  const attributes: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) attributes[attr.name] = attr.value;
  const children: XmlNode[] = [];
  let text = "";
  for (const n of Array.from(el.childNodes)) {
    if (n.nodeType === Node.ELEMENT_NODE) children.push(elementToObject(n as Element));
    else if (n.nodeType === Node.TEXT_NODE) text += n.textContent ?? "";
  }
  return { tag: el.tagName, attributes, children, text: text.trim() };
}

export function xmlToJson(xml: string): string {
  const root = parseXml(xml).documentElement;
  const node = elementToObject(root);
  const serialize = (n: XmlNode): unknown => {
    if (n.children.length === 0) {
      return Object.keys(n.attributes).length > 0
        ? { "#text": n.text, ...makeAttrs(n) }
        : (n.text || null);
    }
    const obj: Record<string, unknown> = {};
    if (Object.keys(n.attributes).length > 0) Object.assign(obj, makeAttrs(n));
    for (const child of n.children) {
      const value = serialize(child);
      if (obj[child.tag]) {
        obj[child.tag] = Array.isArray(obj[child.tag]) ? [...(obj[child.tag] as unknown[]), value] : [obj[child.tag], value];
      } else {
        obj[child.tag] = value;
      }
    }
    if (n.text) obj["#text"] = n.text;
    return obj;
  };
  const makeAttrs = (n: XmlNode) => Object.fromEntries(Object.entries(n.attributes).map(([k, v]) => [`@${k}`, v]));
  return JSON.stringify(serialize(node), null, 2);
}

export function jsonToXml(input: string, rootName = "root"): string {
  const parsed: unknown = JSON.parse(input);
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const build = (key: string, value: unknown): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") {
      const entries = Object.entries(value as Record<string, unknown>);
      const attrKeys = entries.filter(([k]) => k.startsWith("@"));
      const textKey = entries.find(([k]) => k === "#text");
      const childKeys = entries.filter(([k]) => !k.startsWith("@") && k !== "#text");
      const attrs = attrKeys.map(([k, v]) => ` ${k.slice(1)}="${escape(String(v))}"`).join("");
      if (childKeys.length === 0) {
        return `<${key}${attrs}>${textKey ? escape(String(textKey[1])) : ""}</${key}>`;
      }
      const body = childKeys.map(([k, v]) =>
        Array.isArray(v) ? v.map((item) => build(k, item)).join("") : build(k, v),
      ).join("");
      return `<${key}${attrs}>${textKey ? escape(String(textKey[1])) : ""}${body}</${key}>`;
    }
    return `<${key}>${escape(String(value))}</${key}>`;
  };

  if (parsed === null || typeof parsed !== "object") {
    throw new Error("JSON root must be an object");
  }
  return build(rootName, parsed);
}

export function extractTextFromXml(xml: string): string {
  const doc = parseXml(xml);
  return (doc.documentElement.textContent ?? "").trim();
}