import React from "react";
import Box from "@mui/material/Box";

import { Legend, Timeline } from "@/components/controls";
import { LEGEND_HEADING_LABEL, APP_MIN_WIDTH, TRANSITIONS } from "@/constants";
import { LayerItem, TimelineMark } from "@/common/types";
import { useApp } from "@/context/AppContext";

/**
 * Map screen left rail: stacks `Legend` and `Timeline` with narrow-layout flex
 * rules. Part of the map page layout (`layouts/`), not leaf `controls/`.
 */
type MapLegendColumnProps = {
  hasError: boolean;
  narrowLayout: boolean;
  isResizing: boolean;
  legendLayers: LayerItem[];
  isMapIdle: boolean;
  marks: TimelineMark[];
};

export const MapLegendColumn: React.FC<MapLegendColumnProps> = ({
  hasError,
  narrowLayout,
  isResizing,
  legendLayers,
  isMapIdle,
  marks,
}) => {
  const { selectedYear } = useApp();

  if (hasError) return null;

  return (
    <Box
      sx={{
        minWidth: APP_MIN_WIDTH,
        width: narrowLayout ? APP_MIN_WIDTH : "100%",
        flexShrink: 0,
        alignSelf: "stretch",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        transition: isResizing ? "none" : TRANSITIONS.LAYOUT_WIDTH,
        ...(narrowLayout && {
          minHeight: 0,
          flex: 1,
        }),
      }}
    >
      <Legend
        label={LEGEND_HEADING_LABEL}
        layers={legendLayers}
        isMapIdle={isMapIdle}
        selectedYear={selectedYear}
      />
      <Box sx={narrowLayout ? { marginTop: "auto" } : undefined}>
        <Timeline marks={marks} />
      </Box>
    </Box>
  );
};
