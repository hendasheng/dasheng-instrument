import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  publicDir: "public",
  cacheDir: "../../node_modules/.vite/apps/minitool",
  build: {
    outDir: "dist/0.1",
    emptyOutDir: true,
    copyPublicDir: true,
    cssCodeSplit: false,
    lib: {
      entry: resolve(import.meta.dirname, "src/main.tsx"),
      name: "LoudroomMinitool",
      formats: ["iife"],
      fileName: () => "assets/app.js",
      cssFileName: "style",
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) =>
          assetInfo.name === "style.css" ? "assets/style.css" : "assets/[name][extname]",
      },
    },
  },
});
