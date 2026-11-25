import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves the site at https://bmwelu12.github.io/halo/
export default defineConfig({
  base: process.env.GITHUB_PAGES ? "/halo/" : "/",
  plugins: [react()],
  optimizeDeps: { exclude: ["@huggingface/transformers"] },
  test: { include: ["tests/**/*.test.ts"] },
} as any);
