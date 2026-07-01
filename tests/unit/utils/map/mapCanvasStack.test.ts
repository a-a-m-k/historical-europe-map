import { describe, expect, it } from "vitest";

import {
  clampOverlayZoomToMin,
  getCanvasContextAttributes,
  getCanvasStyle,
} from "@/utils/map";

describe("mapCanvasStack helpers", () => {
  it("clamps zoom to effective min when near minimum", () => {
    const next = clampOverlayZoomToMin(
      { longitude: 10, latitude: 20, zoom: 3.0000004 },
      3
    );
    expect(next.zoom).toBe(3);
    expect(next.longitude).toBe(10);
    expect(next.latitude).toBe(20);
  });

  it("keeps zoom when above effective minimum", () => {
    const next = clampOverlayZoomToMin(
      { longitude: 10, latitude: 20, zoom: 4.2 },
      3
    );
    expect(next.zoom).toBe(4.2);
  });

  it("returns map canvas context attributes", () => {
    expect(getCanvasContextAttributes()).toEqual({
      preserveDrawingBuffer: true,
    });
  });

  it("returns default canvas style", () => {
    expect(getCanvasStyle()).toEqual({
      width: "100%",
      height: "100%",
    });
  });
});
