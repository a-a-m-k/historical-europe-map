import React from "react";
import "maplibre-gl/dist/maplibre-gl.css";

import { MapCanvasStack } from "./MapCanvasStack";
import { MapViewShell } from "./MapViewShell";
import { useApp } from "@/context/AppContext";
import {
  useMapViewOrchestration,
  type MapViewLayoutProps,
} from "@/hooks/map";

export type { MapViewLayoutProps, MapLibreMaxBounds } from "@/hooks/map";

const MapView: React.FC<MapViewLayoutProps> = props => {
  const { filteredTowns, selectedYear } = useApp();
  const { shellProps, canvasStackProps } = useMapViewOrchestration({
    ...props,
    filteredTowns,
    selectedYear,
  });

  return (
    <MapViewShell {...shellProps}>
      <MapCanvasStack {...canvasStackProps} />
    </MapViewShell>
  );
};

export default MapView;
