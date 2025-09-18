import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: "https://de284553b9b4c7a3f7bcd9786eb802f2@o4509151884148736.ingest.us.sentry.io/4510040067735557",
  sendDefaultPii: true,
  integrations: [
    new BrowserTracing(), // React + Browser tracing
    new Sentry.Replay(), // Session replay
  ],
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enableLogs: true,
});
