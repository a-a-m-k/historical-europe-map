import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { join, relative } from "path";

function resolveHook(
  hook: unknown
): ((...args: unknown[]) => unknown) | undefined {
  if (typeof hook === "function")
    return hook as (...args: unknown[]) => unknown;
  if (
    hook &&
    typeof hook === "object" &&
    "handler" in hook &&
    typeof (hook as { handler?: unknown }).handler === "function"
  ) {
    return (hook as { handler: (...args: unknown[]) => unknown }).handler;
  }
  return undefined;
}

describe("vite-plugin-resource-hints", () => {
  let tempRoot = "";

  beforeEach(() => {
    vi.clearAllMocks();
    tempRoot = mkdtempSync(join(process.cwd(), ".tmp-hem-rh-"));
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("adds modulepreload for the /assets/index-* entry script", async () => {
    const html = [
      "<!doctype html>",
      "<html><head></head><body>",
      '<script type="module" src="/assets/vendor-123.js"></script>',
      '<script type="module" src="/assets/index-abc.js"></script>',
      "</body></html>",
    ].join("\n");
    mkdirSync(join(tempRoot, "dist"), { recursive: true });
    writeFileSync(join(tempRoot, "dist", "index.html"), html, "utf-8");

    const { vitePluginResourceHints } =
      await import("../../../vite-plugin-resource-hints");
    const plugin = vitePluginResourceHints();
    const configResolved = resolveHook(plugin.configResolved);
    configResolved?.({
      build: { outDir: relative(process.cwd(), join(tempRoot, "dist")) },
    } as never);
    const generateBundle = resolveHook(plugin.generateBundle);
    generateBundle?.(
      {} as never,
      {
        "assets/index-abc.js": {
          type: "chunk",
          fileName: "assets/index-abc.js",
          isEntry: true,
        },
      } as never,
      false
    );
    const closeBundle = resolveHook(plugin.closeBundle);
    await closeBundle?.();

    const writtenHtml = readFileSync(
      join(tempRoot, "dist", "index.html"),
      "utf-8"
    );
    expect(writtenHtml).toContain(
      '<link rel="modulepreload" href="/assets/index-abc.js" />'
    );
  });

  it("does not add duplicate preload if one already exists", async () => {
    const html = [
      "<!doctype html>",
      "<html><head>",
      '<link rel="modulepreload" href="/assets/index-abc.js" />',
      "</head><body>",
      '<script type="module" src="/assets/index-abc.js"></script>',
      "</body></html>",
    ].join("\n");
    mkdirSync(join(tempRoot, "dist"), { recursive: true });
    writeFileSync(join(tempRoot, "dist", "index.html"), html, "utf-8");

    const { vitePluginResourceHints } =
      await import("../../../vite-plugin-resource-hints");
    const plugin = vitePluginResourceHints();
    const configResolved = resolveHook(plugin.configResolved);
    configResolved?.({
      build: { outDir: relative(process.cwd(), join(tempRoot, "dist")) },
    } as never);
    const generateBundle = resolveHook(plugin.generateBundle);
    generateBundle?.(
      {} as never,
      {
        "assets/index-abc.js": {
          type: "chunk",
          fileName: "assets/index-abc.js",
          isEntry: true,
        },
      } as never,
      false
    );
    const closeBundle = resolveHook(plugin.closeBundle);
    await closeBundle?.();

    const writtenHtml = readFileSync(
      join(tempRoot, "dist", "index.html"),
      "utf-8"
    );
    expect(writtenHtml).toContain(
      '<link rel="modulepreload" href="/assets/index-abc.js" />'
    );
    const preloadCount = (writtenHtml.match(/rel="modulepreload"/g) || [])
      .length;
    expect(preloadCount).toBe(1);
  });

  it("warns and exits gracefully when html cannot be read", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mkdirSync(join(tempRoot, "dist"), { recursive: true });

    const { vitePluginResourceHints } =
      await import("../../../vite-plugin-resource-hints");
    const plugin = vitePluginResourceHints();
    const configResolved = resolveHook(plugin.configResolved);
    configResolved?.({
      build: { outDir: relative(process.cwd(), join(tempRoot, "dist")) },
    } as never);
    const generateBundle = resolveHook(plugin.generateBundle);
    generateBundle?.(
      {} as never,
      {
        "assets/index-abc.js": {
          type: "chunk",
          fileName: "assets/index-abc.js",
          isEntry: true,
        },
      } as never,
      false
    );
    const closeBundle = resolveHook(plugin.closeBundle);
    await closeBundle?.();

    expect(warnSpy).toHaveBeenCalledWith(
      "[vite-plugin-resource-hints] ⚠ Could not inject resource hints:",
      expect.any(Error)
    );
    warnSpy.mockRestore();
  });
});
