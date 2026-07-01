import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

import { useResponsive } from "@/hooks/ui";

export type LegendItemLayout = "chip" | "grid";

export interface LegendItemProps {
  layer: string;
  color: string;
  layout?: LegendItemLayout;
}

/**
 * One population-range row: colored dot + label.
 * Grid layout renders two cells (marker column + label) for vertical marker alignment.
 */
export const LegendItem: React.FC<LegendItemProps> = React.memo(
  ({ layer, color, layout = "chip" }) => {
    const theme = useTheme();
    const { isMobileLayout } = useResponsive();
    const { borders, shadows, colors } = theme.custom.legend;

    const indicatorStyles = useMemo(
      () => ({
        width: isMobileLayout ? theme.spacing(2) : theme.spacing(2.5),
        height: isMobileLayout ? theme.spacing(2) : theme.spacing(2.5),
        borderRadius: "50%",
        flexShrink: 0,
        border: borders.layerIndicator,
        boxShadow: shadows.layerDot,
        bgcolor: color,
      }),
      [borders.layerIndicator, shadows.layerDot, isMobileLayout, theme, color]
    );

    const labelStyles = useMemo(
      () => ({
        fontWeight: 600,
        color: colors.layerLabel,
        fontSize: { xs: "10.5px", sm: "11px" },
        lineHeight: 1.3,
        whiteSpace: "nowrap" as const,
      }),
      [colors.layerLabel]
    );

    if (layout === "grid") {
      return (
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <Box sx={indicatorStyles} role="presentation" aria-hidden="true" />
          </Box>
          <Typography component="span" sx={labelStyles}>
            {layer}
          </Typography>
        </>
      );
    }

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          transition: theme.custom.transitions.opacity,
          "&:hover": {
            opacity: 0.8,
          },
        }}
      >
        <Box
          sx={{
            ...indicatorStyles,
            mr: isMobileLayout ? theme.spacing(1.25) : theme.spacing(1.75),
          }}
          role="presentation"
          aria-hidden="true"
        />
        <Typography component="span" sx={labelStyles}>
          {layer}
        </Typography>
      </Box>
    );
  }
);

LegendItem.displayName = "LegendItem";
