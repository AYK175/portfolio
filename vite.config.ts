import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves this at https://ayk175.github.io/portfolio/ (needs the /portfolio/ subpath).
// Vercel serves it at the domain root, so use "/" there — Vercel sets VERCEL=1 during build.
export default defineConfig({
  base: process.env.VERCEL ? "/" : "/portfolio/",
  plugins: [react()],
});
