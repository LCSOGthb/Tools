import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: "https://de284553b9b4c7a3f7bcd9786eb802f2@o4509151884148736.ingest.us.sentry.io/4510040067735557",
  sendDefaultPii: true,
  integrations: [new BrowserTracing(), new Sentry.Replay()],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enableLogs: true,
});

Sentry.captureException(new Error("Automatic test error on page load"));