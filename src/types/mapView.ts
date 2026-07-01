import type { MutableRefObject } from "react";
import type { MapProps, MapRef } from "react-map-gl/maplibre";

import type { Town } from "@/common/types";
import type { MapViewState } from "@/hooks/map/camera/useMapViewState";

/** Camera + bounds props aligned with the interactive map (no `mapStyle`). */
export type MapViewSharedCameraProps = Pick<
  MapProps,
  "longitude" | "latitude" | "zoom" | "minZoom" | "maxZoom" | "maxBounds"
> & { maxBoundsViscosity?: number };

export type MapCanvasCameraProps = {
  mapRef: MutableRefObject<MapRef | null>;
  sharedViewProps: MapViewSharedCameraProps;
  effectiveMinZoom: number;
  onMove: (nextViewState: MapViewState) => void;
};

export type MapCanvasOverlayProps = {
  onLoad: () => void;
  onIdle: () => void;
  mapStyle: NonNullable<MapProps["mapStyle"]>;
  loaded: boolean;
  ready: boolean;
};

export type MapCanvasTownsProps = {
  geojson: GeoJSON.FeatureCollection<
    GeoJSON.Geometry,
    GeoJSON.GeoJsonProperties
  >;
  towns: Town[];
  selectedYear: number;
  styleMode: "light" | "dark";
};

export type MapCanvasControlsProps = {
  enableZoom: boolean;
  showOverlayButtons: boolean;
  showZoomButtons: boolean;
  isTablet: boolean;
  isMobile: boolean;
};

/** Grouped props for {@link MapCanvasStack} (from `useMapViewOrchestration`). */
export type MapCanvasStackProps = {
  camera: MapCanvasCameraProps;
  overlay: MapCanvasOverlayProps;
  towns: MapCanvasTownsProps;
  controls: MapCanvasControlsProps;
};
