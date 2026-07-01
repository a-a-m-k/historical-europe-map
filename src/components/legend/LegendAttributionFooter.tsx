import React from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

import { AttributionLinks } from "@/components/ui";
import { LEGEND_CONTENT_SPACING } from "@/utils/legend";

export const LegendAttributionFooter: React.FC = () => {
  const theme = useTheme();
  const { borders } = theme.custom.legend;

  return (
    <Box
      component="footer"
      sx={{
        borderTop: borders.sectionDivider,
        px: LEGEND_CONTENT_SPACING.paddingX,
        pt: LEGEND_CONTENT_SPACING.sectionPaddingTop,
        pb: LEGEND_CONTENT_SPACING.footerPaddingBottom,
        "& [data-legend-attribution]": {
          mt: 0,
          mb: 0,
        },
      }}
    >
      <AttributionLinks rowAlignment="center" />
    </Box>
  );
};
