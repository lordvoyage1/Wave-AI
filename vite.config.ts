import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

function spaFallback(): Plugin {
  return {
    name: "spa-fallback-404",
    apply: "build",
    closeBundle() {
      const outDir = path.resolve(__dirname, "dist");
      const indexFile = path.join(outDir, "index.html");
      if (!fs.existsSync(indexFile)) return;
      const html = fs.readFileSync(indexFile, "utf8");
      fs.writeFileSync(path.join(outDir, "404.html"), html, "utf8");
      fs.writeFileSync(path.join(outDir, "200.html"), html, "utf8");
      const redirectsSrc = path.resolve(__dirname, "public", "_redirects");
      if (fs.existsSync(redirectsSrc)) {
        fs.copyFileSync(redirectsSrc, path.join(outDir, "_redirects"));
      } else {
        fs.writeFileSync(path.join(outDir, "_redirects"), "/*    /index.html   200\n", "utf8");
      }
    },
  };
}

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
  },
  plugins: [
    react(),
    spaFallback(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["lucide-react", "sonner"],
          "supabase": ["@supabase/supabase-js"],
        },
      },
    },
  },
});
