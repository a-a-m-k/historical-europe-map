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

export function getCanvasContextAttributes(isSplitBasemap: boolean): {
  alpha?: true;
  preserveDrawingBuffer: boolean;
} {
  return isSplitBasemap
    ? { alpha: true, preserveDrawingBuffer: true }
    : { preserveDrawingBuffer: true };
}

export function getCanvasStyle(
  isSplitBasemap: boolean
): Record<string, string | number> {
  return isSplitBasemap
    ? {
        position: "absolute",
        inset: 0,
        zIndex: 1,
        width: "100%",
        height: "100%",
      }
    : { width: "100%", height: "100%" };
}
