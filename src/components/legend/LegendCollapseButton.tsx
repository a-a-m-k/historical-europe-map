import React from "react";
import IconButton from "@mui/material/IconButton";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import { alpha, useTheme } from "@mui/material/styles";

import { strings } from "@/locales";

export interface LegendCollapseButtonProps {
  isExpanded: boolean;
  onToggle: () => void;
  infoAccent: string;
  collapseIconButton: {
    size: number;
    iconFontSize: number;
  };
}

export const LegendCollapseButton: React.FC<LegendCollapseButtonProps> = ({
  isExpanded,
  onToggle,
  infoAccent,
  collapseIconButton,
}) => {
  const theme = useTheme();

  return (
    <IconButton
      id="legend-collapse-button"
      type="button"
      size="small"
      onClick={onToggle}
      aria-expanded={isExpanded}
      aria-controls="legend-collapsible"
      aria-label={
        isExpanded
          ? strings.legend.collapseLegend
          : strings.legend.expandLegend
      }
      sx={{
        width: collapseIconButton.size,
        height: collapseIconButton.size,
        flexShrink: 0,
        color: infoAccent,
        transition: theme.custom.transitions.color,
        "&:hover": {
          bgcolor: alpha(infoAccent, 0.1),
        },
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
        },
      }}
    >
      {isExpanded ? (
        <KeyboardArrowUp sx={{ fontSize: collapseIconButton.iconFontSize }} />
      ) : (
        <KeyboardArrowDown
          sx={{ fontSize: collapseIconButton.iconFontSize }}
        />
      )}
    </IconButton>
  );
};
