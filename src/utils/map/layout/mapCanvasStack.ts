import type { MapViewState } from "@/hooks/map";

const ZOOM_SNAP_EPSILON = 1e-6;

export function clampOverlayZoomToMin(
  viewState: MapViewState,
  effectiveMinZoom: number
): MapViewState {
  const atOrNearMin = viewState.zoom <= effectiveMinZoom + ZOOM_SNAP_EPSILON;
  return {
    ...viewState,
    zoom: atOrNearMin ? effectiveMinZoom : viewState.zoom,
  };
}

export function getCanvasContextAttributes(): {
  preserveDrawingBuffer: boolean;
} {
  return { preserveDrawingBuffer: true };
}

export function getCanvasStyle(): Record<string, string | number> {
  return { width: "100%", height: "100%" };
}
