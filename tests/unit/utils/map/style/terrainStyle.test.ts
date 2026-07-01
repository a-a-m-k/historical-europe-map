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

  it("returns terrain-dark style for dark mode", async () => {
    vi.stubEnv("VITE_STADIA_API_KEY", "abc123");
    const { getTerrainStyleForMode } =
      await import("@/utils/map/style/terrainStyle");

    const light = getTerrainStyleForMode("light");
    const dark = getTerrainStyleForMode("dark");

    expect(light.name).not.toBe(dark.name);
    expect(dark.layers?.length).toBeGreaterThan(0);
  });
});
