import React from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";

import { LayerItem } from "@/common/types";
import { LegendAttributionFooter } from "./LegendAttributionFooter";
import { LegendHeader } from "./LegendHeader";
import { LegendPopulationList } from "./LegendPopulationList";
import { useLegendExpanded } from "./useLegendExpanded";
import { useLegendLayout } from "./useLegendLayout";

export interface LegendProps {
  label: string;
  layers: LayerItem[];
  selectedYear: number;
  style?: React.CSSProperties;
  isMapIdle?: boolean;
}

export const LegendContent: React.FC<LegendProps> = React.memo(
  ({ layers, label, selectedYear, style, isMapIdle = true }) => {
    const { isExpanded, toggleExpanded } = useLegendExpanded();
    const layout = useLegendLayout({ isMapIdle });

    if (!layers?.length) {
      return null;
    }

    return (
      <Box
        sx={{ width: "100%", ...style }}
        component="section"
        aria-labelledby="legend-heading"
      >
        <LegendHeader
          selectedYear={selectedYear}
          isExpanded={isExpanded}
          onToggleExpanded={toggleExpanded}
          layout={layout}
        />

        <Collapse
          id="legend-collapsible"
          in={isExpanded}
          timeout={300}
          sx={{
            "@media (prefers-reduced-motion: reduce)": {
              transition: "none",
            },
          }}
        >
          <LegendPopulationList
            label={label}
            layers={layers}
            titleStyle={layout.titleStyle}
            stackStyles={layout.stackStyles}
            listBlockStyles={layout.listBlockStyles}
            splitNoDataBand={layout.splitNoDataBand}
          />
          <LegendAttributionFooter />
        </Collapse>
      </Box>
    );
  }
);

LegendContent.displayName = "LegendContent";
