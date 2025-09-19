import { defineConfig } from "vite";
import { codecovVitePlugin } from "@codecov/vite-plugin";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: "Tools",
      uploadToken: process.env.CODECOV_TOKEN,
    }),
  ],
});