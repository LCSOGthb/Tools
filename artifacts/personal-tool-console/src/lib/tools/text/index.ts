import type { TextToolGroup } from "./types";
import { TEXT_PART1 } from "./part1";
import { TEXT_PART2 } from "./part2";
import { texts } from "./existing";

export type { TextToolSpec, TextToolGroup, TextOpt, TextOpts } from "./types";

export const TEXT_GROUPS: TextToolGroup[] = [
  ...TEXT_PART1,
  ...TEXT_PART2,
  ...texts,
];

export const TEXT_TOOLS = TEXT_GROUPS.flatMap((g) => g.tools);

export function getTextTool(slug: string) {
  return TEXT_TOOLS.find((t) => t.slug === slug);
}

export function getTextGroupIds() {
  return TEXT_GROUPS.map((g) => g.id);
}
