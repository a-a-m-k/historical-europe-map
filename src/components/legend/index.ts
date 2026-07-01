/**
 * Map legend — title, population scale, collapse, and attribution.
 */
export { default } from "./Legend";
export { LegendContent, type LegendProps } from "./LegendContent";
export {
  getLegendPaperSurface,
  getLegendTestId,
  getLegendYearLabel,
  getResponsiveStyles,
  LEGEND_CONTENT_SPACING,
  type LegendLayoutOptions,
} from "@/utils/legend";
