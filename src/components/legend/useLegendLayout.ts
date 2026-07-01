import { useMemo } from "react";
import type { CSSProperties } from "react";
import { useTheme, type Theme } from "@mui/material/styles";

import { useResponsive } from "@/hooks/ui";
import { LEGEND_CONTENT_SPACING } from "@/utils/legend";

export interface LegendLayoutFlags {
  isMobileLayout: boolean;
  isTabletLayout: boolean;
}

export interface UseLegendLayoutOptions {
  isMapIdle?: boolean;
}

export interface LegendContentStyles {
  appTitleStyle: CSSProperties;
  titleStyle: CSSProperties;
  subtitleStyle: CSSProperties;
  stackStyles: {
    layoutMode: "grid" | "chips";
    sx: Record<string, unknown>;
  };
  /** Desktop: center the population list while keeping rows left-aligned inside. */
  listBlockStyles?: {
    outer: Record<string, unknown>;
    inner: Record<string, unknown>;
  };
}

export interface LegendLayoutResult extends LegendContentStyles {
  isMobileLayout: boolean;
  isTabletLayout: boolean;
  isMapIdle: boolean;
  /** Divider above “No data” only on large screens; md and below keep one list. */
  splitNoDataBand: boolean;
  /** Phone + tablet: title uses full header width; controls pinned top-right. */
  useCompactLegendHeader: boolean;
  /** Tablet idle: balanced 3-column grid for title + inline controls. */
  useTabletControlGrid: boolean;
  headerPadding: {
    px: number;
    py: number;
  };
  collapseIconButton: {
    size: number;
    iconFontSize: number;
  };
  infoAccent: string;
}

function buildContentStyles(
  theme: Theme,
  layout: LegendLayoutFlags
): LegendContentStyles {
  const { isMobileLayout, isTabletLayout } = layout;

  const appTitleStyle: CSSProperties = {
    margin: 0,
    marginBottom: 0,
    textAlign: "center",
    width: "100%",
    whiteSpace: "nowrap",
    color: theme.custom.legend.colors.title,
    fontSize: isMobileLayout ? "13px" : "14px",
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: "-0.01em",
  };

  const useRowChips = isTabletLayout && !isMobileLayout;
  const useDesktopListBlock = !isMobileLayout && !isTabletLayout;

  const layerGap = theme.spacing(LEGEND_CONTENT_SPACING.layerStackGap);
  const markerLabelGap = isMobileLayout
    ? theme.spacing(1.25)
    : theme.spacing(1.75);
  const markerColumnWidth = theme.spacing(2.5);

  const titleStyle: CSSProperties = {
    margin: 0,
    marginTop: 0,
    marginBottom: theme.spacing(LEGEND_CONTENT_SPACING.headingMarginBottom),
    textAlign: useDesktopListBlock ? "left" : "center",
    width: useDesktopListBlock ? "auto" : "100%",
    color: theme.custom.legend.colors.scaleHeading,
    fontSize: "11px",
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  };

  const subtitleStyle: CSSProperties = {
    margin: 0,
    marginTop: 0,
    marginBottom: 0,
    textAlign: "center",
    width: "100%",
    color: theme.palette.info.main,
    fontSize: isMobileLayout ? "11px" : "11.5px",
    lineHeight: 1.2,
    fontWeight: 600,
  };

  const stackStyles = useRowChips
    ? {
        layoutMode: "chips" as const,
        sx: {
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          alignContent: "center",
          alignSelf: "stretch",
          gap: layerGap,
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          overflowX: "visible",
        },
      }
    : {
        layoutMode: "grid" as const,
        sx: {
          display: "grid",
          gridTemplateColumns: useDesktopListBlock
            ? `${markerColumnWidth} auto`
            : "auto auto",
          justifyContent: useDesktopListBlock ? "start" : "center",
          justifyItems: "start",
          alignItems: "center",
          alignSelf: useDesktopListBlock ? "auto" : "stretch",
          columnGap: markerLabelGap,
          rowGap: layerGap,
          width: useDesktopListBlock ? "auto" : "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          overflowX: "visible",
        },
      };

  const listBlockStyles = useDesktopListBlock
    ? {
        outer: {
          display: "flex",
          justifyContent: "center",
          width: "100%",
        },
        inner: {
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        },
      }
    : undefined;

  return {
    appTitleStyle,
    titleStyle,
    subtitleStyle,
    stackStyles,
    listBlockStyles,
  };
}

/**
 * Single layout hook for legend content: responsive flags, header mode, and typography/stack styles.
 */
export function useLegendLayout(
  options: UseLegendLayoutOptions = {}
): LegendLayoutResult {
  const theme = useTheme();
  const { isTabletLayout, isMobileLayout, rawScreenWidth } = useResponsive();
  const isMapIdle = options.isMapIdle ?? true;

  const layoutFlags = useMemo(
    () => ({ isMobileLayout, isTabletLayout }),
    [isMobileLayout, isTabletLayout]
  );

  const styles = useMemo(
    () => buildContentStyles(theme, layoutFlags),
    [theme, layoutFlags]
  );

  const splitNoDataBand =
    rawScreenWidth >= theme.breakpoints.values.lg;
  const useCompactLegendHeader = isMobileLayout || isTabletLayout;
  const useTabletControlGrid =
    isTabletLayout && isMapIdle && !isMobileLayout;

  const headerPadding = useMemo(
    () => ({
      px: LEGEND_CONTENT_SPACING.paddingX,
      py: LEGEND_CONTENT_SPACING.headerPaddingY,
    }),
    []
  );

  return {
    ...styles,
    isMobileLayout,
    isTabletLayout,
    isMapIdle,
    splitNoDataBand,
    useCompactLegendHeader,
    useTabletControlGrid,
    headerPadding,
    collapseIconButton: theme.custom.legend.collapseIconButton,
    infoAccent: theme.palette.info.main,
  };
}

/** @deprecated Use `useLegendLayout` — kept for existing tests. */
export function useLegendContentStyles(
  theme: Theme,
  layout: LegendLayoutFlags
): LegendContentStyles {
  return buildContentStyles(theme, layout);
}
