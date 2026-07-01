import { describe, expect, it } from "vitest";

describe("maplibreRuntime", () => {
  it("returns a stable promise reference", async () => {
    Object.defineProperty(window.URL, "createObjectURL", {
      value: () => "blob:maplibre-worker",
      configurable: true,
    });

    const moduleA = await import("@/utils/map/runtime/maplibreRuntime");
    const moduleB = await import("@/utils/map/runtime/maplibreRuntime");
    expect(moduleA.maplibreGl).toBe(moduleB.maplibreGl);
  });

  it("resolves with configured maplibre runtime", async () => {
    Object.defineProperty(window.URL, "createObjectURL", {
      value: () => "blob:maplibre-worker",
      configurable: true,
    });

    const { maplibreGl } = await import("@/utils/map/runtime/maplibreRuntime");
    const runtime = await maplibreGl;
    expect(runtime).toBeDefined();
    expect(typeof runtime).toBe("object");
  });
});
