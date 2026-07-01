import React from "react";
import type { CSSProperties } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

import { LayerItem } from "@/common/types";
import { strings } from "@/locales";
import { LEGEND_CONTENT_SPACING } from "@/utils/legend";
import { LegendItem } from "./LegendItem";
import type { LegendContentStyles } from "./useLegendLayout";

export interface LegendPopulationListProps {
  label: string;
  layers: LayerItem[];
  titleStyle: CSSProperties;
  stackStyles: LegendContentStyles["stackStyles"];
  listBlockStyles?: LegendContentStyles["listBlockStyles"];
  splitNoDataBand: boolean;
}

export const LegendPopulationList: React.FC<LegendPopulationListProps> = ({
  label,
  layers,
  titleStyle,
  stackStyles,
  listBlockStyles,
  splitNoDataBand,
}) => {
  const theme = useTheme();
  const { borders } = theme.custom.legend;

  const populationLayers = layers.filter(layer => layer.variant !== "noData");
  const noDataLayers = layers.filter(layer => layer.variant === "noData");
  const itemLayout = stackStyles.layoutMode === "grid" ? "grid" : "chip";

  const layerStack = splitNoDataBand ? (
    <>
      {populationLayers.length > 0 && (
        <Box data-legend-layers sx={stackStyles.sx}>
          {populationLayers.map(({ layer, color }) => (
            <LegendItem
              key={layer}
              layer={layer}
              color={color}
              layout={itemLayout}
            />
          ))}
        </Box>
      )}
      {noDataLayers.length > 0 && (
        <Box
          sx={{
            mt: populationLayers.length > 0 ? theme.spacing(1.5) : 0,
            borderTop: borders.sectionDivider,
            pt: LEGEND_CONTENT_SPACING.sectionPaddingTop,
            width: listBlockStyles ? "100%" : undefined,
          }}
        >
          <Box data-legend-layers sx={stackStyles.sx}>
            {noDataLayers.map(({ layer, color }) => (
              <LegendItem
                key={layer}
                layer={layer}
                color={color}
                layout={itemLayout}
              />
            ))}
          </Box>
        </Box>
      )}
    </>
  ) : (
    <Box data-legend-layers sx={stackStyles.sx}>
      {layers.map(({ layer, color }) => (
        <LegendItem key={layer} layer={layer} color={color} layout={itemLayout} />
      ))}
    </Box>
  );

  const listBody = (
    <>
      <Typography
        component="h2"
        id="legend-heading"
        data-legend-heading
        sx={titleStyle}
      >
        {label}
      </Typography>
      {layerStack}
    </>
  );

  return (
    <Box
      role="region"
      aria-label={strings.legend.scaleDetailsAria}
      sx={{
        borderTop: borders.sectionDivider,
        px: LEGEND_CONTENT_SPACING.paddingX,
        pt: LEGEND_CONTENT_SPACING.sectionPaddingTop,
        pb: LEGEND_CONTENT_SPACING.mainPaddingBottom,
      }}
    >
      {listBlockStyles ? (
        <Box data-legend-list-block sx={listBlockStyles.outer}>
          <Box sx={listBlockStyles.inner}>{listBody}</Box>
        </Box>
      ) : (
        listBody
      )}
    </Box>
  );
};
