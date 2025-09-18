import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import * as Sentry from "@sentry/react";
import "./sentry";

const container = document.getElementById("app")!;
const root = createRoot(container);

root.render(
  <Sentry.ErrorBoundary fallback={<h2>Something went wrong.</h2>}>
    <App />
  </Sentry.ErrorBoundary>,
);
