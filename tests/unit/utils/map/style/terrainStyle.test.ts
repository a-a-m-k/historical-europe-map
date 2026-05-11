import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loggerError = vi.fn();

vi.mock("@/utils/logger", () => ({
  logger: {
    error: loggerError,
  },
}));

describe("terrainStyle", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    loggerError.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("throws and logs when Stadia API key is missing", async () => {
    vi.stubEnv("VITE_STADIA_API_KEY", "");
    const { getTerrainStyle } = await import("@/utils/map/style/terrainStyle");

    expect(() => getTerrainStyle()).toThrow(/VITE_STADIA_API_KEY/);
    expect(loggerError).toHaveBeenCalledTimes(1);
  });

  it("warms up Stadia metadata once when API key exists", async () => {
    vi.stubEnv("VITE_STADIA_API_KEY", "abc123");
    const fetchMock = vi.fn().mockResolvedValue({});
    vi.stubGlobal("fetch", fetchMock);

    const { warmupStadiaStyleMetadata } =
      await import("@/utils/map/style/terrainStyle");
    warmupStadiaStyleMetadata();
    warmupStadiaStyleMetadata();

    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("builds overlay style with optional water-name layer", async () => {
    vi.stubEnv("VITE_STADIA_API_KEY", "abc123");
    const { getPopulationOverlayStyle } =
      await import("@/utils/map/style/terrainStyle");

    const withWater = getPopulationOverlayStyle();
    expect(
      withWater.layers?.some(layer => layer.id === "overlay-water-name")
    ).toBe(true);

    const noWater = getPopulationOverlayStyle({ includeWaterNameLayer: false });
    expect(
      noWater.layers?.some(layer => layer.id === "overlay-water-name")
    ).toBe(false);
    expect(noWater.sources?.["stamen-omt"]).toBeDefined();
  });
});
