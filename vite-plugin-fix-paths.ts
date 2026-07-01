import type { Plugin } from "vite";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import {
  isExternalOrSpecialUrl,
  normalizeBasePath,
  rewriteHtmlAssetUrls,
} from "./vite-plugin-html-utils";

/**
 * Vite plugin to fix absolute paths in built HTML for GitHub Pages deployment
 * Ensures all asset references include the base path
 */
export function vitePluginFixPaths(): Plugin {
  let outputDir = "";
  let baseUrl = "/";

  return {
    name: "vite-plugin-fix-paths",
    enforce: "post",
    apply: "build",
    configResolved(config) {
      outputDir = join(process.cwd(), config.build.outDir || "dist");
      baseUrl = config.base || "/";
    },
    closeBundle() {
      try {
        const htmlPath = join(outputDir, "index.html");
        let htmlContent = readFileSync(htmlPath, "utf-8");

        // Only fix paths if baseUrl is not root
        if (baseUrl !== "/") {
          const { basePath, basePathNoSlash } = normalizeBasePath(baseUrl);
          htmlContent = rewriteHtmlAssetUrls(htmlContent, rawUrl => {
            // Only rewrite absolute-root URLs.
            if (!rawUrl.startsWith("/")) return rawUrl;
            // Already prefixed with base.
            if (
              rawUrl === basePath ||
              rawUrl === `${basePath}/` ||
              rawUrl.startsWith(`${basePath}/`) ||
              rawUrl.startsWith(`/${basePathNoSlash}/`)
            ) {
              return rawUrl;
            }
            if (isExternalOrSpecialUrl(rawUrl)) return rawUrl;
            const cleanPath = rawUrl.replace(/^\/+/, "");
            return `${basePath}/${cleanPath}`;
          });

          writeFileSync(htmlPath, htmlContent, "utf-8");
          console.log(
            `[vite-plugin-fix-paths] ✓ Fixed absolute paths in HTML for base: ${baseUrl}`
          );
        }
      } catch (error) {
        console.warn(`[vite-plugin-fix-paths] ⚠ Could not fix paths:`, error);
      }
    },
  };
}
