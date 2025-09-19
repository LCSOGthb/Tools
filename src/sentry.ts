import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://de284553b9b4c7a3f7bcd9786eb802f2@o4509151884148736.ingest.us.sentry.io/4510040067735557",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration()
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  sendDefaultPii: true,
  enableTracing: true
});

// Optional: force a test error at startup
// Sentry.captureException(new Error("Startup test error"));