import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "REACT_APP_");
  return {
    plugins: [react()],
    // Keep the existing Vercel build-time variable without exposing other environment values.
    define: { "process.env.REACT_APP_BACKEND_URL": JSON.stringify(env.REACT_APP_BACKEND_URL || "") },
    build: { outDir: "build" },
    test: { environment: "jsdom", globals: true, setupFiles: ["./src/setupTests.js"] },
  };
});
