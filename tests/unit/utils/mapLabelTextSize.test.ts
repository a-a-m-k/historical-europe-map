import { describe, expect, it } from "vitest";

import {
  getMapLabelTextSize,
  getMapLabelTextSizeExpression,
} from "@/utils/map/layers/mapLayerExpressions";

describe("map label text size", () => {
  it("builds a zoom-interpolated text-size expression", () => {
    expect(getMapLabelTextSizeExpression()).toEqual([
      "interpolate",
      ["linear"],
      ["zoom"],
      3,
      9,
      8,
      17,
    ]);
  });

  it("clamps to the first and last stops outside the zoom range", () => {
    expect(getMapLabelTextSize(1)).toBe(9);
    expect(getMapLabelTextSize(3)).toBe(9);
    expect(getMapLabelTextSize(8)).toBe(17);
    expect(getMapLabelTextSize(12)).toBe(17);
  });

  it("interpolates linearly between stops", () => {
    expect(getMapLabelTextSize(5.5)).toBeCloseTo(13);
    expect(getMapLabelTextSize(4)).toBeCloseTo(10.6);
  });
});
