import { lazy } from "react";
import type { ToolComponent } from "@/lib/tool-registry";

export function tf<T>(loader: () => Promise<T>): ToolComponent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return lazy(loader as any) as unknown as ToolComponent;
}