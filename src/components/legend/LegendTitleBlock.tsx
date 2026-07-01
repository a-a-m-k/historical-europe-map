import React from "react";
import type { CSSProperties } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { LEGEND_APP_TITLE } from "@/constants";
import { getLegendYearLabel, LEGEND_CONTENT_SPACING } from "@/utils/legend";

export interface LegendTitleBlockProps {
  selectedYear: number;
  appTitleStyle: CSSProperties;
  subtitleStyle: CSSProperties;
  /** Wrap in centered full-width container (compact header). */
  centered?: boolean;
}

export const LegendTitleBlock: React.FC<LegendTitleBlockProps> = ({
  selectedYear,
  appTitleStyle,
  subtitleStyle,
  centered = false,
}) => {
  const content = (
    <>
      <Typography component="p" data-legend-app-title sx={appTitleStyle}>
        {LEGEND_APP_TITLE}
      </Typography>
      <Typography
        component="p"
        data-legend-year
        aria-live="polite"
        aria-atomic="true"
        sx={subtitleStyle}
      >
        {getLegendYearLabel(selectedYear)}
      </Typography>
    </>
  );

  if (!centered) {
    return <>{content}</>;
  }

  return (
    <Box
      data-legend-title-block
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        textAlign: "center",
        width: "100%",
        minWidth: 0,
        gap: LEGEND_CONTENT_SPACING.headerGap,
      }}
    >
      {content}
    </Box>
  );
};
