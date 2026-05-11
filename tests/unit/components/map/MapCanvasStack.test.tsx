import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

import { MAP_LAYER_ID } from "@/constants";
import type { MapViewState } from "@/hooks/map";
import { MapCanvasStack } from "@/components/map/MapView/MapCanvasStack";

const mapSpy = vi.hoisted(() => vi.fn());
const darkBasemapSpy = vi.hoisted(() => vi.fn());
const mapLayerSpy = vi.hoisted(() => vi.fn());
const deferredOverlayActivationMock = vi.hoisted(() => vi.fn());

vi.mock("react-map-gl/maplibre", () => {
  const MapMock = React.forwardRef(
    (
      props: Record<string, unknown>,
      ref: React.ForwardedRef<HTMLDivElement>
    ) => {
      void ref;
      mapSpy(props);
      const onMove = props.onMove as
        | ((evt: { viewState: MapViewState }) => void)
        | undefined;
      if (onMove) {
        onMove({ viewState: { longitude: 10, latitude: 20, zoom: 2.9999998 } });
      }
      return (
        <div data-testid="map-mock">{props.children as React.ReactNode}</div>
      );
    }
  );
  MapMock.displayName = "MapMock";
  return { default: MapMock };
});

vi.mock("@/components/map/MapView/MapViewDarkBasemap", () => ({
  MapViewDarkBasemap: (props: Record<string, unknown>) => {
    darkBasemapSpy(props);
    return <div data-testid="dark-basemap-mock" />;
  },
}));

vi.mock("@/components/map/MapView/MapLayer/MapLayer", () => ({
  default: (props: Record<string, unknown>) => {
    mapLayerSpy(props);
    return <div data-testid="map-layer-mock" />;
  },
}));

vi.mock("@/hooks/map/activation/useDeferredOverlayActivation", () => ({
  useDeferredOverlayActivation: deferredOverlayActivationMock,
}));

vi.mock("@/utils/map/runtime/maplibreRuntime", () => ({
  maplibreGl: {},
}));

const baseProps = {
  isSplitBasemap: false,
  mapLoaded: true,
  basemapMapRef: { current: null },
  mapRef: { current: null },
  sharedViewProps: { longitude: 10, latitude: 20, zoom: 3 },
  onBasemapLoad: vi.fn(),
  onBasemapIdle: vi.fn(),
  preserveDrawingBuffer: true,
  effectiveMinZoom: 3,
  handleMove: vi.fn(),
  onOverlayLoad: vi.fn(),
  onOverlayIdle: vi.fn(),
  overlayMapStyle: { version: 8 as const, sources: {}, layers: [] },
  enableZoomControls: true,
  townsGeojson: { type: "FeatureCollection" as const, features: [] },
  mapStyleMode: "light" as const,
  mapReady: false,
  towns: [],
  selectedYear: 800,
  showOverlayButtons: true,
  showZoomButtons: true,
  isTablet: false,
  isMobile: false,
};

describe("MapCanvasStack", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deferredOverlayActivationMock.mockReturnValue(false);
  });

  it("clamps overlay map zoom to effective minimum on move", () => {
    const handleMove = vi.fn();
    render(<MapCanvasStack {...baseProps} handleMove={handleMove} />);

    expect(handleMove).toHaveBeenCalledWith({
      longitude: 10,
      latitude: 20,
      zoom: 3,
    });
  });

  it("passes core interaction and layer props to map", () => {
    render(<MapCanvasStack {...baseProps} />);
    const mapProps = mapSpy.mock.calls[0][0] as Record<string, unknown>;

    expect(mapProps.crossSourceCollisions).toBe(false);
    expect(mapProps.keyboard).toBe(true);
    expect(mapProps.scrollZoom).toBe(true);
    expect(mapProps.interactiveLayerIds).toEqual([`${MAP_LAYER_ID}-circle`]);
    expect(mapProps.canvasContextAttributes).toEqual({
      preserveDrawingBuffer: true,
    });
    expect(mapProps.style).toEqual({
      width: "100%",
      height: "100%",
    });
  });

  it("renders dark basemap only when split mode is active and map is loaded", () => {
    const { rerender, queryByTestId } = render(
      <MapCanvasStack {...baseProps} />
    );
    expect(queryByTestId("dark-basemap-mock")).not.toBeInTheDocument();

    rerender(
      <MapCanvasStack {...baseProps} isSplitBasemap mapLoaded={false} />
    );
    expect(queryByTestId("dark-basemap-mock")).not.toBeInTheDocument();

    rerender(<MapCanvasStack {...baseProps} isSplitBasemap mapLoaded />);
    expect(queryByTestId("dark-basemap-mock")).toBeInTheDocument();
    expect(darkBasemapSpy).toHaveBeenCalledTimes(1);
  });

  it("switches canvas attributes for split basemap mode", () => {
    render(<MapCanvasStack {...baseProps} isSplitBasemap mapLoaded />);
    const mapProps = mapSpy.mock.calls[0][0] as Record<string, unknown>;

    expect(mapProps.canvasContextAttributes).toEqual({
      alpha: true,
      preserveDrawingBuffer: true,
    });
    expect(mapProps.style).toEqual({
      position: "absolute",
      inset: 0,
      zIndex: 1,
      width: "100%",
      height: "100%",
    });
  });
});
