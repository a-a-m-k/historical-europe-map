import { useMemo, useRef } from "react";
import { Town } from "@/common/types";
import {
  DEFAULT_SCREEN_DIMENSIONS,
  MIN_APP_VIEWPORT,
  DEFAULT_ZOOM,
  INITIAL_ZOOM_OUT_OFFSET,
} from "@/constants";
import { useViewport } from "@/hooks/ui";
import { lightTheme } from "@/theme/theme";
import { calculateBoundsCenter } from "@/utils/geoBounds";
import {
  calculateResponsiveZoom,
  calculateMapArea,
  getGeographicalBoxFromViewport,
} from "@/utils/mapZoom";
import type { Bounds } from "@/utils/geoBounds";
import type { MapArea } from "@/utils/mapZoom";
import { isValidPositiveNumber } from "@/utils/zoom/zoomHelpers";
import { logger } from "@/utils/logger";

export type InitialMapState = {
  center: { latitude: number; longitude: number } | undefined;
  fitZoom: number;
  bounds: Bounds | undefined;
};

/**
 * Pure helper: first-paint camera inputs from town geography and layout dimensions.
 * Prefer {@link useSeedMapCamera} in `MapLayout` so viewport resize does not re-seed the camera.
 */
export function computeInitialMapState(
  towns: Town[],
  mapArea: MapArea | undefined,
  screenWidth: number,
  screenHeight: number
): InitialMapState {
  if (!towns || towns.length === 0) {
    return { center: undefined, fitZoom: DEFAULT_ZOOM, bounds: undefined };
  }

  try {
    const center = calculateBoundsCenter(towns);
    const rawWidth = isValidPositiveNumber(screenWidth)
      ? screenWidth
      : DEFAULT_SCREEN_DIMENSIONS.width;
    const rawHeight = isValidPositiveNumber(screenHeight)
      ? screenHeight
      : DEFAULT_SCREEN_DIMENSIONS.height;
    const validScreenWidth = Math.max(rawWidth, MIN_APP_VIEWPORT.width);
    const validScreenHeight = Math.max(rawHeight, MIN_APP_VIEWPORT.height);
    const zoom = calculateResponsiveZoom(
      towns,
      validScreenWidth,
      validScreenHeight,
      lightTheme
    );
    const fitZoom = Math.max(
      1,
      Math.round(zoom * 100) / 100 - INITIAL_ZOOM_OUT_OFFSET
    );

    const area =
      mapArea ??
      calculateMapArea(validScreenWidth, validScreenHeight, lightTheme);
    const bounds = getGeographicalBoxFromViewport(
      { longitude: center.longitude, latitude: center.latitude },
      fitZoom,
      area.effectiveWidth,
      area.effectiveHeight
    );

    return { center, fitZoom, bounds };
  } catch (error) {
    logger.error("Error computing initial map state:", error);
    return { center: undefined, fitZoom: DEFAULT_ZOOM, bounds: undefined };
  }
}

/**
 * Computes **first paint** map camera inputs from town geography and viewport: bounds center,
 * a responsive fit zoom (with a small zoom-out offset), and geographic bounds for `maxBounds`.
 *
 * Recomputes when towns, map area, or viewport dimensions change. For production layout seeding,
 * use {@link useSeedMapCamera} instead so resize refit stays in {@link useMapCameraLifecycle}.
 */
export function useInitialMapState(
  towns: Town[],
  mapArea: MapArea | undefined
): InitialMapState {
  const { screenWidth, screenHeight } = useViewport();

  return useMemo(
    () => computeInitialMapState(towns, mapArea, screenWidth, screenHeight),
    [towns, mapArea, screenWidth, screenHeight]
  );
}

/**
 * Frozen seed camera for `MapLayout`: recomputes only when `towns` or `deviceKey` change.
 * Viewport resize refit is owned by {@link useMapCameraLifecycle} inside the map orchestrator.
 */
export function useSeedMapCamera(
  towns: Town[],
  deviceKey: string,
  mapArea: MapArea
): InitialMapState {
  const { screenWidth, screenHeight } = useViewport();
  const mapAreaRef = useRef(mapArea);
  mapAreaRef.current = mapArea;

  return useMemo(
    () =>
      computeInitialMapState(
        towns,
        mapAreaRef.current,
        screenWidth,
        screenHeight
      ),
    // mapArea and viewport are read at bust time only (towns load / device-class remount).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: resize must not re-seed
    [towns, deviceKey]
  );
}
