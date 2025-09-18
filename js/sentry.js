Sentry.init({
  dsn: "https://c38250fd2a7fdb30e16b4673276ff3de@o4509151884148736.ingest.us.sentry.io/4510038332080128",
  release: "aiot@0.2",
  environment: "production",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
});

Sentry.addBreadcrumb({
  category: "navigation",
  message: `Visited ${window.location.pathname}`,
  level: "info",
});