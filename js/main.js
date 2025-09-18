// For future interactivity (theme switch, search, etc.)
import * as Sentry from "@sentry/browser";
import { BrowserTracing } from "@sentry/browser";
import { Replay } from "@sentry/replay";

Sentry.init({
  dsn: "https://3410730c33a0ed28fc51370949258ba8@o4509151884148736.ingest.us.sentry.io/4510038139142144",

  // Collect default PII like IP address, user agent
  sendDefaultPii: true,

  // Enable performance monitoring + session replay
  integrations: [new BrowserTracing(), new Replay()],

  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% (lower in prod)

  // Session Replay
  replaysSessionSampleRate: 0.1, // Capture 10% of sessions
  replaysOnErrorSampleRate: 1.0, // Always capture replay on error
});

// Test error
myUndefinedFunction();
console.log("All-in-One Tools loaded.");
