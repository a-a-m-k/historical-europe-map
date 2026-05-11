import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTownsGeoJSON } from "@/hooks/map/data/useTownsGeoJSON";

const townsToGeoJSONMock = vi.hoisted(() => vi.fn());
const loggerErrorMock = vi.hoisted(() => vi.fn());

vi.mock("@/utils/geojson", () => ({
  townsToGeoJSON: townsToGeoJSONMock,
}));

vi.mock("@/utils/logger", () => ({
  logger: {
    error: loggerErrorMock,
  },
}));

describe("useTownsGeoJSON", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty feature collection for empty input", () => {
    const { result } = renderHook(() => useTownsGeoJSON([], 800));

    expect(result.current).toEqual({
      type: "FeatureCollection",
      features: [],
    });
    expect(townsToGeoJSONMock).not.toHaveBeenCalled();
  });

  it("converts towns via townsToGeoJSON when data exists", () => {
    const towns = [
      {
        name: "Paris",
        latitude: 48.8566,
        longitude: 2.3522,
        populationByYear: { "800": 10000 },
      },
    ];
    const geojson = {
      type: "FeatureCollection",
      features: [{ type: "Feature" }],
    };
    townsToGeoJSONMock.mockReturnValue(geojson);

    const { result } = renderHook(() => useTownsGeoJSON(towns, 800));

    expect(townsToGeoJSONMock).toHaveBeenCalledWith(towns, 800);
    expect(result.current).toEqual(geojson);
  });

  it("logs and returns empty feature collection on conversion error", () => {
    const towns = [
      {
        name: "Paris",
        latitude: 48.8566,
        longitude: 2.3522,
        populationByYear: { "800": 10000 },
      },
    ];
    const error = new Error("bad geojson");
    townsToGeoJSONMock.mockImplementation(() => {
      throw error;
    });

    const { result } = renderHook(() => useTownsGeoJSON(towns, 800));

    expect(loggerErrorMock).toHaveBeenCalledWith(
      "Error getting GeoJSON:",
      error
    );
    expect(result.current).toEqual({
      type: "FeatureCollection",
      features: [],
    });
  });
});
