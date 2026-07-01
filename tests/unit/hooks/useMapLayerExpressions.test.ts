import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMapLayerExpressions } from "@/hooks/map/runtime/useMapLayerExpressions";

const getPopulationSortKeyMock = vi.hoisted(() => vi.fn());
const getCircleRadiusExpressionMock = vi.hoisted(() => vi.fn());
const getCircleColorExpressionMock = vi.hoisted(() => vi.fn());
const getLegendColorsForMapModeMock = vi.hoisted(() => vi.fn());

vi.mock("@/constants", () => ({
  POPULATION_THRESHOLDS: [1, 10, 100],
  MIN_MARKER_SIZE: 2,
  MAX_MARKER_SIZE: 20,
}));

vi.mock("@/utils/map", () => ({
  getPopulationSortKey: getPopulationSortKeyMock,
  getCircleRadiusExpression: getCircleRadiusExpressionMock,
  getCircleColorExpression: getCircleColorExpressionMock,
}));

vi.mock("@/constants/population", () => ({
  getLegendColorsForMapMode: getLegendColorsForMapModeMock,
}));

describe("useMapLayerExpressions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPopulationSortKeyMock.mockReturnValue("population");
    getCircleRadiusExpressionMock.mockReturnValue(["interpolate", ["zoom"]]);
    getCircleColorExpressionMock.mockReturnValue(["match", ["get", "pop"]]);
    getLegendColorsForMapModeMock.mockReturnValue(["#111", "#222", "#333"]);
  });

  it("builds expressions with default values", () => {
    const { result } = renderHook(() =>
      useMapLayerExpressions({ mapStyleMode: "light" })
    );

    expect(getLegendColorsForMapModeMock).toHaveBeenCalledWith("light");
    expect(getPopulationSortKeyMock).toHaveBeenCalled();
    expect(getCircleRadiusExpressionMock).toHaveBeenCalled();
    expect(getCircleColorExpressionMock).toHaveBeenCalled();
    expect(result.current).toEqual({
      populationSortKey: "population",
      circleRadiusExpression: ["interpolate", ["zoom"]],
      circleColorExpression: ["match", ["get", "pop"]],
    });
  });

  it("uses custom population and marker size limits", () => {
    renderHook(() =>
      useMapLayerExpressions({
        mapStyleMode: "dark",
        minPopulation: 10,
        maxPopulation: 1000,
        minMarkerSize: 2,
        maxMarkerSize: 30,
      })
    );

    expect(getCircleRadiusExpressionMock).toHaveBeenCalledWith(10, 1000, 2, 30);
  });
});
