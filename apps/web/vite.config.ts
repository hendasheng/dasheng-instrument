import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/dasheng-instrument/0.1/",
  cacheDir: "../../node_modules/.vite/apps/web",
  build: {
    outDir: "dist/0.1",
    emptyOutDir: true,
  },
});
