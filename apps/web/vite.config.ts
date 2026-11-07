import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/dasheng-instrument/0.2/" : "/",
  cacheDir: "../../node_modules/.vite/apps/web",
  server: {
    host: "0.0.0.0",
  },
  build: {
    outDir: "dist/0.2",
    emptyOutDir: true,
  },
}));
