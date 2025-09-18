Sentry.init({
  dsn: "https://c38250fd2a7fdb30e16b4673276ff3de@o4509151884148736.ingest.us.sentry.io/4510038332080128",
  release: typeof SENTRY_RELEASE !== "undefined" ? SENTRY_RELEASE : "aiot@0.2",
  environment: "production",
  integrations: [
    Sentry.BrowserTracing(),
    Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
});

// Optional: track navigation breadcrumbs
Sentry.addBreadcrumb({
  category: "navigation",
  message: `Visited ${window.location.pathname}`,
  level: "info",
});