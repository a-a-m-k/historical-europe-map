import React, { useMemo } from "react";
import Box from "@mui/material/Box";

import { ErrorOverlay } from "@/components/ui";
import { AppProvider } from "@/context/AppContext";
import { useMapStyleMode } from "@/context/MapStyleContext";
import { useLegendLayers } from "@/hooks";
import { useTownsData } from "@/hooks/map";

import { getLegendColorsForMapMode } from "@/constants/population";
import { strings } from "@/locales";
import { MapLayout } from "./MapLayout";
import { TIMELINE_MARKS } from "@/utils/map";

/**
 * Map screen: town bundle load, error UI, then app context + layout.
 * `MapLayout` always mounts after a successful load path; empty/loading uses `showDefaultMap` / overlays.
 */
const MapScreen: React.FC = () => {
  const { mode: mapStyleMode } = useMapStyleMode();
  const legendColors = useMemo(
    () => getLegendColorsForMapMode(mapStyleMode),
    [mapStyleMode]
  );
  const legendLayers = useLegendLayers(legendColors);
  const { towns, isTownsLoading, townsLoadError, retryTownsLoad } =
    useTownsData();

  if (townsLoadError) {
    return (
      <Box
        id="map-container"
        sx={{ width: "100%", height: "100%", position: "relative" }}
      >
        <ErrorOverlay
          title={strings.errors.dataLoadingError}
          message={townsLoadError}
          onRetry={retryTownsLoad}
        />
      </Box>
    );
  }

  return (
    <AppProvider towns={towns}>
      <MapLayout
        legendLayers={legendLayers}
        marks={TIMELINE_MARKS}
        showDefaultMap={isTownsLoading || towns.length === 0}
        isTownsLoading={isTownsLoading}
      />
    </AppProvider>
  );
};

export default MapScreen;
