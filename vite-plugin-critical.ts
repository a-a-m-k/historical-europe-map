import type { Plugin } from "vite";
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";
import type { CriticalGenerateResult } from "critical";
import { rewriteHtmlAssetUrls } from "./vite-plugin-html-utils";

interface ViteCriticalOptions {
  /**
   * Base directory for files
   * @default process.cwd()
   */
  base?: string;
  /**
   * HTML source file
   * @default 'index.html'
   */
  src?: string;
  /**
   * Output file destination
   * @default 'index.html'
   */
  dest?: string;
  /**
   * Viewport dimension for critical CSS extraction
   * @default { width: 1300, height: 900 }
   */
  dimension?: { width: number; height: number };
  /**
   * Whether to inline critical CSS in HTML head
   * @default true
   */
  inline?: boolean;
  /**
   * Base URL for the application
   * @default '/'
   */
  baseUrl?: string;
}

/**
 * Vite plugin that extracts and inlines critical CSS using the `critical` package.
 */
export function vitePluginCritical(options: ViteCriticalOptions = {}): Plugin {
  const {
    base = process.cwd(),
    dest = "index.html",
    dimension = { width: 1300, height: 900 },
    inline = true,
    baseUrl = "/",
  } = options;

  let distDir = "";
  let outputDir = "";
  let viteBaseUrl = "/";

  const isRecoverableCriticalError = (value: unknown): boolean => {
    if (!(value instanceof Error)) {
      return false;
    }
    const message = value.message;
    return (
      message.includes("Failed to launch the browser") ||
      message.includes("browser process") ||
      message.includes("TROUBLESHOOTING") ||
      message.includes("Timed out after") ||
      message.includes("SEGV") ||
      message.includes("Received signal")
    );
  };

  const isCriticalCssSkipped = (): boolean =>
    process.env.SKIP_CRITICAL_CSS === "1" ||
    process.env.SKIP_CRITICAL_CSS === "true";

  const runWithUnhandledRejectionGuard = async <T>(
    task: () => Promise<T>
  ): Promise<T> => {
    const onUnhandledRejection = (reason: unknown) => {
      if (isRecoverableCriticalError(reason)) {
        console.warn(
          "[vite-plugin-critical] ⚠ Browser unavailable/timeout during critical CSS extraction. Skipping optimization."
        );
        return;
      }
      throw reason;
    };

    process.on("unhandledRejection", onUnhandledRejection);
    try {
      return await task();
    } finally {
      process.off("unhandledRejection", onUnhandledRejection);
    }
  };

  return {
    name: "vite-plugin-critical",
    enforce: "post",
    apply: "build",
    async closeBundle() {
      if (isCriticalCssSkipped()) {
        console.warn(
          "[vite-plugin-critical] ⚠ SKIP_CRITICAL_CSS is set. Skipping critical CSS extraction."
        );
        return;
      }

      try {
        const htmlPath = join(outputDir, dest);

        // Brief delay to ensure emitted files are flushed.
        await new Promise(resolve => setTimeout(resolve, 100));

        // Skip gracefully if HTML output is missing.
        if (!existsSync(htmlPath)) {
          console.warn(
            `[vite-plugin-critical] ⚠ HTML file not found at ${htmlPath}. Skipping critical CSS extraction.`
          );
          return;
        }

        // Load `critical` lazily so normal builds don't require eager resolution.
        const critical = await import("critical");
        const criticalGenerate = critical.generate || critical.default;

        const htmlContent = readFileSync(htmlPath, "utf-8");
        const actualBaseUrl = baseUrl !== "/" ? baseUrl : viteBaseUrl;

        // For non-root bases, strip the prefix so critical resolves relative paths
        // correctly, then restore it in the output afterwards.
        let tempHtmlPath: string | null = null;
        let srcPath = htmlPath;
        const basePath =
          actualBaseUrl !== "/"
            ? actualBaseUrl.replace(/\/$/, "").replace(/^\//, "")
            : null;

        if (basePath) {
          const stripped = rewriteHtmlAssetUrls(htmlContent, (url: string) => {
            if (!url.startsWith("/")) return url;
            return url.startsWith(`/${basePath}/`)
              ? `/${url.slice(basePath.length + 2)}`
              : url;
          });
          tempHtmlPath = join(outputDir, "index.temp.html");
          writeFileSync(tempHtmlPath, stripped, "utf-8");
          srcPath = tempHtmlPath;
        }

        const criticalOptions: Record<string, unknown> = {
          base: outputDir,
          src: srcPath,
          inline,
          width: dimension.width,
          height: dimension.height,
        };

        let result: CriticalGenerateResult | null = null;
        try {
          result = await runWithUnhandledRejectionGuard(() =>
            criticalGenerate(criticalOptions)
          );
        } catch (generateError) {
          if (isRecoverableCriticalError(generateError)) {
            console.warn(
              "[vite-plugin-critical] ⚠ Critical CSS extraction failed. Skipping optimization."
            );
            return;
          }
          throw generateError;
        }

        if (result?.html) {
          let finalHtml: string = result.html;
          if (basePath) {
            // Restore base-prefixed asset paths that critical normalised away.
            finalHtml = rewriteHtmlAssetUrls(finalHtml, (url: string) => {
              if (!url.startsWith("/")) return url;
              if (url === `/${basePath}` || url.startsWith(`/${basePath}/`)) {
                return url;
              }
              return `${actualBaseUrl}${url.slice(1)}`;
            });
          }
          writeFileSync(htmlPath, finalHtml, "utf-8");
          console.log(
            `[vite-plugin-critical] ✓ Critical CSS extracted and inlined successfully`
          );
        } else if (result?.css) {
          // Fallback: inject returned CSS into <head> of the original (un-stripped) HTML.
          const styleTag = `<style id="critical-css">${result.css}</style>`;
          writeFileSync(
            htmlPath,
            htmlContent.replace("</head>", `${styleTag}\n</head>`),
            "utf-8"
          );
          console.log(
            `[vite-plugin-critical] ✓ Critical CSS extracted and inlined successfully`
          );
        }

        // Best-effort temp file cleanup.
        if (tempHtmlPath) {
          try {
            unlinkSync(tempHtmlPath);
          } catch {
            // Ignore cleanup errors
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("Cannot find module 'critical'")) {
            console.warn(
              `[vite-plugin-critical] ⚠ 'critical' package not found. Install it with: npm install --save-dev critical`
            );
          } else if (
            error.message.includes("Failed to launch the browser") ||
            error.message.includes("browser process") ||
            error.message.includes("TROUBLESHOOTING")
          ) {
            console.warn(
              `[vite-plugin-critical] ⚠ Browser launch failed. Critical CSS extraction skipped.`
            );
            console.warn(
              `[vite-plugin-critical] This is usually due to missing Puppeteer dependencies.`
            );
            console.warn(
              `[vite-plugin-critical] To fix: Install Puppeteer dependencies or skip critical CSS extraction.`
            );
            console.warn(
              `[vite-plugin-critical] Build will continue without critical CSS optimization.`
            );
          } else {
            console.error(
              "[vite-plugin-critical] ✗ Error extracting critical CSS:",
              error
            );
            // Keep build non-fatal when critical CSS extraction fails.
            console.warn(
              "[vite-plugin-critical] Build will continue without critical CSS optimization"
            );
          }
        } else {
          console.error(
            "[vite-plugin-critical] ✗ Error extracting critical CSS:",
            error
          );
          console.warn(
            "[vite-plugin-critical] Build will continue without critical CSS optimization"
          );
        }
      }
    },
    configResolved(config) {
      distDir = config.build.outDir || "dist";
      outputDir = join(base, distDir);
      viteBaseUrl = config.base || "/";
    },
  };
}
