import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "lcsorganization-el",
      project: "tools",
    }),
  ],

  // points to the root now
  root: ".",

  build: {
    sourcemap: true,
  },
});
