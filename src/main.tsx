import React from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "@sentry/react";
import App from "./App";
import "./sentry"; // ⚠️ must be imported first

const container = document.getElementById("app")!;
const root = createRoot(container);

root.render(
  <ErrorBoundary fallback={<h2>Something went wrong.</h2>}>
    <App />
  </ErrorBoundary>
);