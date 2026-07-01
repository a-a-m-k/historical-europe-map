import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { lightTheme } from "@/theme/theme";
import {
  useMapViewConfig,
  useSharedViewProps,
} from "@/hooks/map/camera/useMapViewConfig";

describe("useMapViewConfig", () => {
  it("sanitizes invalid initial props", () => {
    const { result } = renderHook(() =>
      useMapViewConfig({
        longitude: Number.NaN,
        latitude: Number.POSITIVE_INFINITY,
        initialZoom: -1,
        maxBounds: undefined,
        fallbackMapSize: undefined,
        screenWidth: 1024,
        screenHeight: 768,
        theme: lightTheme,
      })
    );

    expect(result.current.safeProps).toEqual({
      longitude: 0,
      latitude: 0,
      zoom: 4,
    });
  });

  it("uses fit-to-bounds zoom when maxBounds are provided", () => {
    const maxBounds = [
      [0, 40],
      [20, 60],
    ] as [[number, number], [number, number]];
    const { result } = renderHook(() =>
      useMapViewConfig({
        longitude: 10,
        latitude: 50,
        initialZoom: 3,
        maxBounds,
        fallbackMapSize: { effectiveWidth: 600, effectiveHeight: 400 },
        screenWidth: 1200,
        screenHeight: 800,
        theme: lightTheme,
      })
    );

    expect(result.current.effectiveMinZoom).toBeGreaterThanOrEqual(3);
  });

  it("does not zoom in past seed fit when fallback map area is smaller than measured container", () => {
    const maxBounds = [
      [-10, 40],
      [20, 60],
    ] as [[number, number], [number, number]];
    const seedZoom = 3.5;
    const { result } = renderHook(() =>
      useMapViewConfig({
        longitude: 10,
        latitude: 50,
        initialZoom: seedZoom,
        maxBounds,
        fallbackMapSize: { effectiveWidth: 310, effectiveHeight: 420 },
        screenWidth: 360,
        screenHeight: 800,
        theme: lightTheme,
      })
    );

    expect(result.current.effectiveMinZoom).toBeLessThanOrEqual(seedZoom + 0.05);
  });
});

describe("useSharedViewProps", () => {
  it("includes bounds and viscoscity when maxBounds exist", () => {
    const viewState = { longitude: 10, latitude: 50, zoom: 4 };
    const maxBounds = [
      [0, 40],
      [20, 60],
    ] as [[number, number], [number, number]];
    const { result } = renderHook(() =>
      useSharedViewProps(viewState, maxBounds, 5)
    );

    expect(result.current).toMatchObject({
      longitude: 10,
      latitude: 50,
      zoom: 4,
      maxBounds,
      maxBoundsViscosity: 1,
      minZoom: 5,
    });
  });
});
