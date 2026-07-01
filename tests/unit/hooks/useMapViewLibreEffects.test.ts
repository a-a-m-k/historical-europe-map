import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { MapRef } from "react-map-gl/maplibre";
import type { RefObject } from "react";

import { useMapViewLibreEffects } from "@/hooks/map/runtime/useMapViewLibreEffects";

type MapStub = {
  setPrefetchZoomDelta: ReturnType<typeof vi.fn>;
  setMaxBounds: ReturnType<typeof vi.fn>;
  jumpTo: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
};

function createMapStub(): MapStub {
  return {
    setPrefetchZoomDelta: vi.fn(),
    setMaxBounds: vi.fn(),
    jumpTo: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };
}

function makeMapRef(map: MapStub | null): RefObject<MapRef | null> {
  return { current: map ? ({ getMap: () => map } as unknown as MapRef) : null };
}

describe("useMapViewLibreEffects", () => {
  const viewState = { longitude: 10, latitude: 50, zoom: 4 };
  const maxBounds = [
    [0, 40],
    [20, 60],
  ] as [[number, number], [number, number]];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies map load settings and max bounds for overlay map", () => {
    const overlayMap = createMapStub();
    const mapRef = makeMapRef(overlayMap);

    const { result } = renderHook(() =>
      useMapViewLibreEffects({
        mapRef,
        mapReady: true,
        viewState,
        maxBounds,
      })
    );

    act(() => {
      result.current.handleOverlayMapLoad();
    });

    expect(overlayMap.setPrefetchZoomDelta).toHaveBeenCalledWith(0);
    expect(overlayMap.setMaxBounds).toHaveBeenCalledWith(maxBounds);
  });

  it("syncs camera on style.load when map is ready", () => {
    const overlayMap = createMapStub();
    let styleLoadHandler: (() => void) | null = null;
    overlayMap.on.mockImplementation((event: string, cb: () => void) => {
      if (event === "style.load") styleLoadHandler = cb;
    });

    const mapRef = makeMapRef(overlayMap);

    const requestAnimationFrameSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation(cb => {
        cb(0);
        return 1;
      });

    renderHook(() =>
      useMapViewLibreEffects({
        mapRef,
        mapReady: true,
        viewState,
        maxBounds: undefined,
      })
    );

    expect(overlayMap.on).toHaveBeenCalledWith(
      "style.load",
      expect.any(Function)
    );

    act(() => {
      styleLoadHandler?.();
    });

    expect(requestAnimationFrameSpy).toHaveBeenCalled();
    expect(overlayMap.jumpTo).toHaveBeenCalledWith({
      center: [viewState.longitude, viewState.latitude],
      zoom: viewState.zoom,
    });
  });

  it("applies maxBounds effect to overlay map", () => {
    const overlayMap = createMapStub();
    const mapRef = makeMapRef(overlayMap);

    renderHook(() =>
      useMapViewLibreEffects({
        mapRef,
        mapReady: false,
        viewState,
        maxBounds,
      })
    );

    expect(overlayMap.setMaxBounds).toHaveBeenCalledWith(maxBounds);
  });
});
