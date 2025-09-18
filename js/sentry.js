Sentry.init({
  dsn: "https://c38250fd2a7fdb30e16b4673276ff3de@o4509151884148736.ingest.us.sentry.io/4510038332080128",
  integrations: [],
  tracesSampleRate: 1.0, // 100% performance data (lower later if too much)
});

// Optional: track page visits
Sentry.addBreadcrumb({
  category: "navigation",
  message: `Visited ${window.location.pathname}`,
  level: "info",
});
