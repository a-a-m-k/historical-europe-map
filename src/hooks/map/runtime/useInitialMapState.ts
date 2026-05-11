import { useMemo } from "react";
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

/**
 * Computes **first paint** map camera inputs from town geography and viewport: bounds center,
 * a responsive fit zoom (with a small zoom-out offset), and geographic bounds for `maxBounds`.
 *
 * Pass `mapArea` from `MapLayout` so bounds math matches the real map column; when omitted,
 * derives area from screen × `lightTheme` breakpoints. Uses `lightTheme` intentionally so
 * light/dark basemap toggles do not reshuffle the initial fit.
 *
 * @returns `center` / `bounds` may be undefined when there are no towns or on error; `fitZoom` always falls back to `DEFAULT_ZOOM`.
 */
export function useInitialMapState(
  towns: Town[],
  mapArea: MapArea | undefined
): {
  center: { latitude: number; longitude: number } | undefined;
  fitZoom: number;
  bounds: Bounds | undefined;
} {
  const { screenWidth, screenHeight } = useViewport();

  return useMemo(() => {
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
  }, [towns, mapArea, screenWidth, screenHeight]);
}
