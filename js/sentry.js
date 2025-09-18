Sentry.init({
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0, // Performance monitoring
  replaysSessionSampleRate: 0.1, // Record 10% of sessions
  replaysOnErrorSampleRate: 1.0, // Always record on error
});

// Test error (remove after verification)
setTimeout(() => {
  myUndefinedFunction();
}, 2000);
