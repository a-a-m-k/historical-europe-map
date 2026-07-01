import { useMemo } from "react";
import { Town } from "@/common/types";
import { townsToGeoJSON } from "@/utils/geojson";
import { logger } from "@/utils/logger";

/**
 * Memoized **FeatureCollection** for MapLibre from town rows and a year: population and geometry
 * per feature come from {@link townsToGeoJSON}. Empty or invalid input yields an empty collection;
 * errors are logged and also return empty features.
 *
 * @param towns - Year-filtered towns from app state (or undefined while loading).
 * @param selectedYear - Drives `population` / visibility on each point feature.
 * @returns A `GeoJSON.FeatureCollection` suitable for a `Source` `data` prop.
 */
export const useTownsGeoJSON = (
  towns: Town[] | undefined,
  selectedYear: number
) => {
  return useMemo(() => {
    try {
      if (!towns || !Array.isArray(towns) || towns.length === 0) {
        return {
          type: "FeatureCollection" as const,
          features: [],
        };
      }

      return townsToGeoJSON(towns, selectedYear);
    } catch (error) {
      logger.error("Error getting GeoJSON:", error);
      return {
        type: "FeatureCollection" as const,
        features: [],
      };
    }
  }, [towns, selectedYear]);
};
