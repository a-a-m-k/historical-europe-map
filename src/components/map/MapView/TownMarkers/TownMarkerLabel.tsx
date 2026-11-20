import React, { useEffect, useState } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useMapStyleMode } from "@/context/MapStyleContext";
import { MARKER_STYLES } from "@/constants/keyboard";
import { getMapLabelTextSize } from "@/utils/map";

export interface TownMarkerLabelProps {
  townName: string;
  population: number;
  markerSize: number;
}

/**
 * Component that displays a label for a focused/hovered town marker.
 * Shows town name and population information.
 * Font size follows map zoom using the same curve as the symbol-layer town labels.
 */
export const TownMarkerLabel: React.FC<TownMarkerLabelProps> = ({
  townName,
  population,
  markerSize,
}) => {
  const { mode: mapStyleMode } = useMapStyleMode();
  const { current: map } = useMap();
  const [zoom, setZoom] = useState<number | undefined>(() => map?.getZoom());

  useEffect(() => {
    if (!map) return;
    const handleZoom = () => setZoom(map.getZoom());
    handleZoom();
    map.on("zoom", handleZoom);
    return () => {
      map.off("zoom", handleZoom);
    };
  }, [map]);

  const labelCssVars = {
    "--town-marker-label-top": `${markerSize / 2 + MARKER_STYLES.LABEL_OFFSET}px`,
    ...(zoom !== undefined && {
      "--town-marker-label-font-size": `${getMapLabelTextSize(zoom)}px`,
    }),
  } as React.CSSProperties;

  return (
    <div className="town-marker-label-container" style={labelCssVars}>
      <div
        className={
          mapStyleMode === "dark"
            ? "town-marker-label-content town-marker-label-content--dark"
            : "town-marker-label-content"
        }
      >
        <div>{townName}</div>
        <div className="town-marker-label-population">
          {population > 0 ? population.toLocaleString() : "N/A"}
        </div>
      </div>
    </div>
  );
};
