import type { Plugin } from "vite";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { normalizeBasePath } from "./vite-plugin-html-utils";

/**
 * Vite plugin to inject resource hints (preload/prefetch) for critical assets
 * This improves performance by hinting the browser about important resources
 *
 * Preloads:
 * - Main entry script (modulepreload)
 */
export function vitePluginResourceHints(): Plugin {
  let outputDir = "";
  let base = "/";
  let entryScriptHref: string | null = null;

  return {
    name: "vite-plugin-resource-hints",
    enforce: "post",
    apply: "build",
    configResolved(config) {
      outputDir = join(process.cwd(), config.build.outDir || "dist");
      base = config.base || "/";
    },
    generateBundle(_outputOptions, bundle) {
      const entryChunk = Object.values(bundle).find(
        item => item.type === "chunk" && item.isEntry
      );
      if (!entryChunk || entryChunk.type !== "chunk") return;

      const { basePath } = normalizeBasePath(base);
      const normalizedBase = basePath === "" ? "/" : `${basePath}/`;
      entryScriptHref = `${normalizedBase}${entryChunk.fileName}`.replace(
        /\/{2,}/g,
        "/"
      );
    },
    async closeBundle() {
      try {
        const htmlPath = join(outputDir, "index.html");
        let htmlContent = readFileSync(htmlPath, "utf-8");
        if (!entryScriptHref) return;

        const preloadLinks: string[] = [];
        const hasPreloadFor = (src: string) =>
          htmlContent.includes(`rel="modulepreload" href="${src}"`) ||
          htmlContent.includes(
            `rel="modulepreload" crossorigin href="${src}"`
          ) ||
          htmlContent.includes(
            `rel="modulepreload" crossorigin="" href="${src}"`
          );

        // Preload entry script discovered from Rollup bundle metadata.
        if (!hasPreloadFor(entryScriptHref)) {
          preloadLinks.push(
            `    <link rel="modulepreload" href="${entryScriptHref}" />`
          );
        }

        if (preloadLinks.length > 0) {
          const updatedHtml = htmlContent.includes("</head>")
            ? htmlContent.replace(
                "</head>",
                `${preloadLinks.join("\n")}\n</head>`
              )
            : `${preloadLinks.join("\n")}\n${htmlContent}`;

          writeFileSync(htmlPath, updatedHtml, "utf-8");

          console.log(
            `[vite-plugin-resource-hints] ✓ Added modulepreload hints for: main bundle`
          );
        }
      } catch (error) {
        console.warn(
          `[vite-plugin-resource-hints] ⚠ Could not inject resource hints:`,
          error
        );
      }
    },
  };
}
