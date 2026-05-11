import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { visualizer } from "rollup-plugin-visualizer";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { vitePluginCritical } from "./vite-plugin-critical";
import { vitePluginResourceHints } from "./vite-plugin-resource-hints";
import { vitePluginFixPaths } from "./vite-plugin-fix-paths";

/** Base path for production (e.g. GitHub Pages subpath). Single source for build output. */
const BUILD_BASE = (process.env.VITE_BASE_PATH as string | undefined) ?? "/";

const manifestPlugin = (base: string) => ({
  name: "manifest-transform",
  writeBundle() {
    const manifestPath = join(process.cwd(), "dist", "manifest.json");
    if (!existsSync(manifestPath)) {
      return;
    }
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    const basePath = base.replace(/\/$/, "");
    manifest.icons = manifest.icons.map((icon: { src: string }) => ({
      ...icon,
      src: icon.src.replace("/icons/", `${basePath}/icons/`),
    }));
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  },
});

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tsconfigPaths(),
    ...(command === "build"
      ? [
          visualizer({
            filename: "dist/bundle-analysis.html",
            open: false,
            gzipSize: true,
            brotliSize: true,
            template: "treemap",
          }),
          manifestPlugin(BUILD_BASE),
          vitePluginResourceHints(),
          vitePluginCritical({
            base: process.cwd(),
            src: "index.html",
            dest: "index.html",
            dimension: { width: 1300, height: 900 },
            inline: true,
            baseUrl: BUILD_BASE,
          }),
          vitePluginFixPaths(), // Fix paths after other plugins modify HTML
        ]
      : []),
  ],
  base: command === "build" ? BUILD_BASE : "/",
  preview: {
    // Configure preview server to serve from base path
    port: 4173,
    strictPort: false,
  },
  optimizeDeps: {
    // Full package include for stable dev pre-bundle. To narrow (faster cold start),
    // replace with the specific subpaths in use: @mui/material/Box, /Button, /Paper,
    // /Typography, /Alert, /AlertTitle, /styles, /colors, etc. and icons one-by-one.
    include: [
      "@mui/material",
      "@mui/icons-material",
      "@emotion/react",
      "@emotion/styled",
    ],
    // Avoid transforming class fields to __publicField() so MapLibre's worker code
    // (which runs in a separate scope) doesn't reference an undefined helper.
    esbuildOptions: {
      target: "esnext",
    },
  },
  // Path aliases are handled by vite-tsconfig-paths plugin
  // which automatically reads from tsconfig.json paths
  build: {
    // Preserve class fields (no __publicField) so MapLibre worker works in production.
    target: "esnext",
    sourcemap: false,
    // Enable CSS code splitting for better caching
    // CSS will be split by component/route, reducing initial bundle size
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: id => {
          if (id.includes("html2canvas")) {
            return "html2canvas";
          }
          if (id.includes("node_modules")) {
            if (id.includes("maplibre-gl-csp-worker")) {
              return "maplibre-worker";
            }
            if (id.includes("node_modules/maplibre-gl")) {
              return "maplibre-core";
            }
            if (id.includes("node_modules/@maplibre")) {
              return "maplibre-deps";
            }
            if (
              id.includes("node_modules/@vis.gl/react-maplibre") ||
              id.includes("node_modules/react-map-gl")
            ) {
              return "react-map";
            }
            return "vendor";
          }
        },
      },
    },
    // MapLibre core is intentionally isolated as a lazy-loaded chunk and currently lands
    // around ~1.0 MiB minified; keep this warning limit just above that known baseline
    // to avoid noisy warnings while still flagging real regressions.
    chunkSizeWarningLimit: 1200,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],
      },
      mangle: {
        safari10: true,
      },
    },
  },
}));
