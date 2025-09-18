Sentry.init({
  dsn: "https://3410730c33a0ed28fc51370949258ba8@o4508406269995008.ingest.us.sentry.io/4508406275608576",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
