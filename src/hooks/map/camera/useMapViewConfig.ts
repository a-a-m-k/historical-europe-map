import { useMemo } from "react";
import type { Theme } from "@mui/material/styles";

import type { MapViewSharedCameraProps } from "@/types/mapView";
import type { MapViewState } from "./useMapViewState";
import { isValidNumber } from "@/utils/zoom/zoomHelpers";
import { getZoomToFitBounds } from "@/utils/mapZoom";
import { calculateMapArea } from "@/utils/mapZoom";
import { DEFAULT_MAP_CONTAINER_PROPS } from "@/utils/map";

type MapLibreMaxBounds = [[number, number], [number, number]];

type UseMapViewConfigArgs = {
  longitude: number;
  latitude: number;
  initialZoom: number;
  maxBounds?: MapLibreMaxBounds;
  containerSize: { width: number; height: number } | null;
  fallbackMapSize?: { effectiveWidth: number; effectiveHeight: number };
  screenWidth: number;
  screenHeight: number;
  theme: Theme;
};

/**
 * Derives **safe** numeric map props (guards NaN) and the **effective minimum zoom** when `maxBounds`
 * is set: computes the zoom that fits the bounding box in the current (or fallback) map area and
 * clamps the seed zoom up to that value so MapLibre never shows out-of-bounds tiles.
 *
 * @param longitude - Seed longitude from layout (may be invalid until data loads).
 * @param latitude - Seed latitude.
 * @param initialZoom - Requested zoom; replaced with a floor if below the zoom needed to contain `maxBounds`.
 * @param maxBounds - Optional `[[sw],[ne]]` in lng/lat; drives `effectiveMinZoom`.
 * @param containerSize - Measured map column from {@link useMapContainerResize}, or null before first layout.
 * @param fallbackMapSize - Optional override for fit math when `containerSize` is null.
 * @param screenWidth - Viewport width for fallback {@link calculateMapArea}.
 * @param screenHeight - Viewport height for fallback map area.
 * @param theme - MUI theme for breakpoint-based map area (matches layout).
 * @returns `safeProps` for React state seeding; `effectiveMinZoom` for `minZoom` / camera reset helpers.
 */
export const useMapViewConfig = ({
  longitude,
  latitude,
  initialZoom,
  maxBounds,
  containerSize,
  fallbackMapSize: fallbackMapSizeProp,
  screenWidth,
  screenHeight,
  theme,
}: UseMapViewConfigArgs) => {
  const safeProps = useMemo(
    () => ({
      longitude: isValidNumber(longitude) ? longitude : 0,
      latitude: isValidNumber(latitude) ? latitude : 0,
      zoom: isValidNumber(initialZoom) && initialZoom >= 0 ? initialZoom : 4,
    }),
    [longitude, latitude, initialZoom]
  );

  /** Fallback map size when container not yet measured (prop from parent, or local). */
  const fallbackMapSizeLocal = useMemo(
    () => calculateMapArea(screenWidth, screenHeight, theme),
    [screenWidth, screenHeight, theme]
  );
  const fallbackMapSize = fallbackMapSizeProp ?? fallbackMapSizeLocal;

  /** Effective min zoom: when maxBounds is set, zoom that fits bounds in container (or fallback map size). */
  const effectiveMinZoom = useMemo(() => {
    if (!maxBounds) return safeProps.zoom;
    const bounds = {
      minLat: maxBounds[0][1],
      maxLat: maxBounds[1][1],
      minLng: maxBounds[0][0],
      maxLng: maxBounds[1][0],
    };
    const w = containerSize?.width ?? fallbackMapSize.effectiveWidth;
    const h = containerSize?.height ?? fallbackMapSize.effectiveHeight;
    const zoomToFit = getZoomToFitBounds(bounds, w, h);
    return Math.max(safeProps.zoom, zoomToFit);
  }, [maxBounds, containerSize, safeProps.zoom, fallbackMapSize]);

  return { safeProps, effectiveMinZoom };
};

/**
 * Builds the `react-map-gl` **shared** camera props object: spreads `viewState`, attaches `maxBounds`
 * + viscosity when present, sets `minZoom` to `effectiveMinZoom`, and caps `maxZoom` from defaults.
 */
export const useSharedViewProps = (
  viewState: MapViewState,
  maxBounds: MapLibreMaxBounds | undefined,
  effectiveMinZoom: number
): MapViewSharedCameraProps =>
  useMemo(
    () => ({
      ...viewState,
      ...(maxBounds && {
        maxBounds,
        maxBoundsViscosity: 1,
      }),
      minZoom: effectiveMinZoom,
      maxZoom: DEFAULT_MAP_CONTAINER_PROPS.maxZoom,
    }),
    [viewState, maxBounds, effectiveMinZoom]
  );
