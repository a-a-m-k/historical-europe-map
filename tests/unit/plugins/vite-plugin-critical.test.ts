import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { join } from "path";
import { tmpdir } from "os";

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

const criticalGenerateMock = vi.hoisted(() => vi.fn());

vi.mock("critical", () => ({
  generate: criticalGenerateMock,
}));

describe("vite-plugin-critical", () => {
  let tempRoot = "";

  beforeEach(() => {
    vi.clearAllMocks();
    tempRoot = mkdtempSync(join(tmpdir(), "hem-critical-"));
    mkdirSync(join(tempRoot, "dist"), { recursive: true });
    writeFileSync(
      join(tempRoot, "dist", "index.html"),
      '<html><head></head><body><script src="/assets/index-abc.js"></script></body></html>',
      "utf-8"
    );
    criticalGenerateMock.mockResolvedValue({
      html: "<html><head><style>/* critical */</style></head><body></body></html>",
    });
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("passes configured dimensions to critical and omits unsupported minify option", async () => {
    const { vitePluginCritical } =
      await import("../../../vite-plugin-critical");
    const plugin = vitePluginCritical({
      base: tempRoot,
      dimension: { width: 900, height: 500 },
    });
    const configResolved = resolveHook(plugin.configResolved);
    configResolved?.({
      build: { outDir: "dist" },
      base: "/",
    } as never);

    const closeBundle = resolveHook(plugin.closeBundle);
    await closeBundle?.();

    expect(criticalGenerateMock).toHaveBeenCalledTimes(1);
    const options = criticalGenerateMock.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(options.width).toBe(900);
    expect(options.height).toBe(500);
    expect(options).not.toHaveProperty("minify");
    const writtenHtml = readFileSync(
      join(tempRoot, "dist", "index.html"),
      "utf-8"
    );
    expect(writtenHtml).toContain("<style>/* critical */</style>");
  });

  it("uses temp html and cleans it up for non-root baseUrl", async () => {
    const { vitePluginCritical } =
      await import("../../../vite-plugin-critical");
    const plugin = vitePluginCritical({
      base: tempRoot,
      baseUrl: "/historical-europe-map/",
    });
    const configResolved = resolveHook(plugin.configResolved);
    configResolved?.({
      build: { outDir: "dist" },
      base: "/historical-europe-map/",
    } as never);

    const closeBundle = resolveHook(plugin.closeBundle);
    await closeBundle?.();

    const options = criticalGenerateMock.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(String(options.src)).toContain("index.temp.html");
    const tempHtmlPath = join(tempRoot, "dist", "index.temp.html");
    expect(() => readFileSync(tempHtmlPath, "utf-8")).toThrow();
  });

  it("warns and exits when index.html is missing", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    rmSync(join(tempRoot, "dist", "index.html"), { force: true });

    const { vitePluginCritical } =
      await import("../../../vite-plugin-critical");
    const plugin = vitePluginCritical({
      base: tempRoot,
    });
    const configResolved = resolveHook(plugin.configResolved);
    configResolved?.({
      build: { outDir: "dist" },
      base: "/",
    } as never);
    const closeBundle = resolveHook(plugin.closeBundle);
    await closeBundle?.();

    expect(criticalGenerateMock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      `[vite-plugin-critical] ⚠ HTML file not found at ${join(
        tempRoot,
        "dist",
        "index.html"
      )}. Skipping critical CSS extraction.`
    );
    warnSpy.mockRestore();
  });
});
