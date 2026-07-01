import React from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

import { LEGEND_CONTENT_SPACING } from "@/utils/legend";
import { LegendHeaderControls } from "./LegendHeaderControls";
import { LegendTitleBlock } from "./LegendTitleBlock";
import type { LegendLayoutResult } from "./useLegendLayout";

export interface LegendHeaderProps {
  selectedYear: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  layout: Pick<
    LegendLayoutResult,
    | "appTitleStyle"
    | "subtitleStyle"
    | "headerPadding"
    | "useCompactLegendHeader"
    | "useTabletControlGrid"
    | "isTabletLayout"
    | "isMapIdle"
    | "collapseIconButton"
    | "infoAccent"
  >;
}

export const LegendHeader: React.FC<LegendHeaderProps> = ({
  selectedYear,
  isExpanded,
  onToggleExpanded,
  layout,
}) => {
  const theme = useTheme();
  const {
    appTitleStyle,
    subtitleStyle,
    headerPadding,
    useCompactLegendHeader,
    useTabletControlGrid,
    isTabletLayout,
    isMapIdle,
    collapseIconButton,
    infoAccent,
  } = layout;

  const collapseProps = {
    isExpanded,
    onToggle: onToggleExpanded,
    infoAccent,
    collapseIconButton,
  };

  const controls = (
    <LegendHeaderControls
      {...collapseProps}
      showTabletActions={isTabletLayout && isMapIdle}
    />
  );

  if (useCompactLegendHeader) {
    if (useTabletControlGrid) {
      return (
        <Box
          component="header"
          data-legend-header="compact"
          sx={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1fr) minmax(0, auto) minmax(0, 1fr)",
            alignItems: "flex-start",
            columnGap: 1,
            ...headerPadding,
          }}
        >
          <Box aria-hidden sx={{ minWidth: 0 }} />
          <LegendTitleBlock
            selectedYear={selectedYear}
            appTitleStyle={appTitleStyle}
            subtitleStyle={subtitleStyle}
            centered
          />
          {controls}
        </Box>
      );
    }

    return (
      <Box
        component="header"
        data-legend-header="compact"
        sx={{
          position: "relative",
          ...headerPadding,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: theme.spacing(LEGEND_CONTENT_SPACING.headerPaddingY),
            right: theme.spacing(LEGEND_CONTENT_SPACING.paddingX),
          }}
        >
          {controls}
        </Box>
        <LegendTitleBlock
          selectedYear={selectedYear}
          appTitleStyle={appTitleStyle}
          subtitleStyle={subtitleStyle}
          centered
        />
      </Box>
    );
  }

  return (
    <Box
      component="header"
      data-legend-header="desktop"
      sx={{
        position: "relative",
        ...headerPadding,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: theme.spacing(LEGEND_CONTENT_SPACING.headerPaddingY),
          right: theme.spacing(LEGEND_CONTENT_SPACING.paddingX),
        }}
      >
        <LegendHeaderControls
          {...collapseProps}
          showTabletActions={false}
        />
      </Box>
      <LegendTitleBlock
        selectedYear={selectedYear}
        appTitleStyle={appTitleStyle}
        subtitleStyle={subtitleStyle}
        centered
      />
    </Box>
  );
};
