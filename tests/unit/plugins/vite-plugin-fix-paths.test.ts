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

describe("vite-plugin-fix-paths", () => {
  let tempRoot = "";

  beforeEach(() => {
    vi.clearAllMocks();
    tempRoot = mkdtempSync(join(process.cwd(), ".tmp-hem-fp-"));
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("rewrites absolute src/href paths with configured base URL", async () => {
    const html = [
      "<!doctype html>",
      "<html><head>",
      '<link rel="manifest" href="/manifest.json">',
      "</head><body>",
      '<script type="module" src="/assets/index-abc.js"></script>',
      "</body></html>",
    ].join("\n");
    mkdirSync(join(tempRoot, "dist"), { recursive: true });
    writeFileSync(join(tempRoot, "dist", "index.html"), html, "utf-8");

    const { vitePluginFixPaths } =
      await import("../../../vite-plugin-fix-paths");
    const plugin = vitePluginFixPaths();
    const configResolved = resolveHook(plugin.configResolved);
    configResolved?.({
      build: { outDir: relative(process.cwd(), join(tempRoot, "dist")) },
      base: "/historical-europe-map/",
    } as never);
    const closeBundle = resolveHook(plugin.closeBundle);
    await closeBundle?.();

    const writtenHtml = readFileSync(
      join(tempRoot, "dist", "index.html"),
      "utf-8"
    );
    expect(writtenHtml).toContain('href="/historical-europe-map/manifest.json"');
    expect(writtenHtml).toContain('src="/historical-europe-map/assets/index-abc.js"');
  });

  it("skips rewriting when base URL is root", async () => {
    const html = '<script type="module" src="/assets/index-abc.js"></script>';
    mkdirSync(join(tempRoot, "dist"), { recursive: true });
    writeFileSync(join(tempRoot, "dist", "index.html"), html, "utf-8");

    const { vitePluginFixPaths } =
      await import("../../../vite-plugin-fix-paths");
    const plugin = vitePluginFixPaths();
    const configResolved = resolveHook(plugin.configResolved);
    configResolved?.({
      build: { outDir: relative(process.cwd(), join(tempRoot, "dist")) },
      base: "/",
    } as never);
    const closeBundle = resolveHook(plugin.closeBundle);
    await closeBundle?.();

    const writtenHtml = readFileSync(
      join(tempRoot, "dist", "index.html"),
      "utf-8"
    );
    expect(writtenHtml).toBe(html);
  });

  it("warns and exits gracefully when html cannot be read", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mkdirSync(join(tempRoot, "dist"), { recursive: true });

    const { vitePluginFixPaths } =
      await import("../../../vite-plugin-fix-paths");
    const plugin = vitePluginFixPaths();
    const configResolved = resolveHook(plugin.configResolved);
    configResolved?.({
      build: { outDir: relative(process.cwd(), join(tempRoot, "dist")) },
      base: "/historical-europe-map/",
    } as never);
    const closeBundle = resolveHook(plugin.closeBundle);
    await closeBundle?.();

    expect(warnSpy).toHaveBeenCalledWith(
      "[vite-plugin-fix-paths] ⚠ Could not fix paths:",
      expect.any(Error)
    );
    warnSpy.mockRestore();
  });
});
