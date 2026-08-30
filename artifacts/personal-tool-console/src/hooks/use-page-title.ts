import { useEffect } from "react";

export const SITE_NAME = "Toolbox";

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  }, [title]);
}