import React from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "@sentry/react";
import App from "./App";
import "./sentry";

const container = document.getElementById("app")!;
if (!container) throw new Error("No root container found");

const root = createRoot(container);

root.render(
  <ErrorBoundary fallback={<h2>Something went wrong.</h2>}>
    <App />
  </ErrorBoundary>,
);
