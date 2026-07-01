import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

import { MAP_LAYER_ID } from "@/constants";
import type { MapViewState } from "@/hooks/map";
import type { MapCanvasStackProps } from "@/types/mapView";
import { MapCanvasStack } from "@/components/map/MapView/MapCanvasStack";

const mapSpy = vi.hoisted(() => vi.fn());
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

const baseProps: MapCanvasStackProps = {
  camera: {
    mapRef: { current: null },
    sharedViewProps: { longitude: 10, latitude: 20, zoom: 3 },
    effectiveMinZoom: 3,
    onMove: vi.fn(),
  },
  overlay: {
    onLoad: vi.fn(),
    onIdle: vi.fn(),
    mapStyle: { version: 8 as const, sources: {}, layers: [] },
    loaded: true,
    ready: false,
  },
  towns: {
    geojson: { type: "FeatureCollection" as const, features: [] },
    towns: [],
    selectedYear: 800,
    styleMode: "light",
  },
  controls: {
    enableZoom: true,
    showOverlayButtons: true,
    showZoomButtons: true,
    isTablet: false,
    isMobile: false,
  },
};

describe("MapCanvasStack", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deferredOverlayActivationMock.mockReturnValue(false);
  });

  it("clamps overlay map zoom to effective minimum on move", () => {
    const onMove = vi.fn();
    render(
      <MapCanvasStack
        {...baseProps}
        camera={{ ...baseProps.camera, onMove }}
      />
    );

    expect(onMove).toHaveBeenCalledWith({
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
});
