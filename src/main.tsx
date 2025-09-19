import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import * as Sentry from "@sentry/react";

try {
  await import("./sentry");
} catch (e) {
  console.warn("Sentry failed to load:", e);
}

const container = document.getElementById("app");
if (!container) throw new Error("No root container found");

const root = createRoot(container);
root.render(<App />);

Sentry.captureException(new Error("Manual test event"));