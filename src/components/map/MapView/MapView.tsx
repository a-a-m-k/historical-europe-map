import React from "react";
import "maplibre-gl/dist/maplibre-gl.css";

import { MapCanvasStack } from "./MapCanvasStack";
import { MapViewShell } from "./MapViewShell";
import {
  useMapViewOrchestration,
  type MapViewComponentProps,
} from "@/hooks/map";

export type { MapViewComponentProps, MapLibreMaxBounds } from "@/hooks/map";

const MapView: React.FC<MapViewComponentProps> = props => {
  const { shellProps, canvasStackProps } = useMapViewOrchestration(props);

  return (
    <MapViewShell {...shellProps}>
      <MapCanvasStack {...canvasStackProps} />
    </MapViewShell>
  );
};

export default MapView;
