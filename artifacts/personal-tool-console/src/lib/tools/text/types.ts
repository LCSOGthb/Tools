// Shared types for the bulk TEXT tool engine.
// Pure logic only — no React imports.

export type TextOpt =
  | {
      kind: "text";
      key: string;
      label: string;
      default?: string;
      placeholder?: string;
    }
  | {
      kind: "number";
      key: string;
      label: string;
      default?: number;
      min?: number;
      max?: number;
      step?: number;
    }
  | {
      kind: "select";
      key: string;
      label: string;
      options: string[];
      default?: string;
    }
  | { kind: "toggle"; key: string; label: string; default?: boolean };

export type TextOpts = Record<string, string | number | boolean | undefined>;

export type TextToolSpec = {
  slug: string;
  name: string;
  description: string;
  options?: TextOpt[];
  run: (input: string, o: TextOpts) => string;
};

export type TextToolGroup = {
  id: string;
  title: string;
  description?: string;
  tools: TextToolSpec[];
};
