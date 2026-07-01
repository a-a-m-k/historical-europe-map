export const DEFAULT_CENTER = { latitude: 50.0, longitude: 10.0 };
export const DEFAULT_ZOOM = 4;
/** Slightly zoom out from fit so the initial view isn’t tight. */
export const INITIAL_ZOOM_OUT_OFFSET = 0.25;

/**
 * Muted slate for night overlay country borders & legend attribution.
 * Equivalent to `#94a3b180` — `rgb(93, 99, 105)` at alpha `128/255`.
 */
export const MAP_MUTED_SLATE_RGBA = `rgba(93, 99, 105, ${128 / 255})`;

export const MAP_LAYER_ID = "towns-population-layer";

/**
 * Set on each town feature in `townsToGeoJSON` for `circle-sort-key` (WebGL circles).
 * MapLibre draws higher keys on top; this value matches population when known so large cities
 * sit above small ones. Use a moderate negative floor (not ±1e18) so style expressions stay
 * within stable float range in MapLibre.
 */
export const POPULATION_SORT_KEY_PROP = "populationSortKey" as const;
/**
 * Precomputed label-priority rank for symbol collision placement.
 * Lower ranks are placed first: larger population first, then alphabetical by name.
 */
export const MAP_LABEL_SORT_RANK_PROP = "mapLabelSortRank" as const;
/** Precomputed text for the MapLibre symbol `text-field` (name + population / N/A). */
export const MAP_LABEL_TEXT_PROP = "mapLabelText" as const;

/** Below any realistic population value so N/A towns stay under measured cities. */
export const POPULATION_SORT_KEY_NO_DATA = -1_000_000_000;

/**
 * Terrain basemap symbol layers for sea / ocean / lake names (`terrain.json` / `terrain-dark.json`).
 *
 * Manual QA:
 * - Light and dark (single map): Town text is rendered declaratively with
 *   `crossSourceCollisions={false}`, so basemap symbols cannot suppress custom town labels.
 *   Labels still collide within the town-label source (`text-allow-overlap: false`,
 *   `text-ignore-placement: false`) to reduce overlap noise.
 */
export const MAP_BASEMAP_WATER_LABEL_LAYER_IDS = [
  "water-line-label",
  "water-point-label",
] as const;

export const WORLD_DIMENSIONS = { width: 256, height: 256 };
export const MAX_ZOOM_LEVEL = 20;
export const DEGREES_IN_CIRCLE = 360;

export const COORDINATE_LIMITS = {
  LATITUDE: { min: -90, max: 90 },
  LONGITUDE: { min: -180, max: 180 },
} as const;

export const FLOATING_BUTTON_SIZE = 45;
/** Circular save / reset on map overlay below `md` (tablet / small widths; compact row). */
export const SCREENSHOT_BUTTON_SIZE = 36;
/**
 * Floating overlay tools on phones only (`xs`); ~30% larger than `SCREENSHOT_BUTTON_SIZE` for touch targets.
 */
export const MAP_OVERLAY_FLOATING_TOOL_SIZE_PHONE = Math.round(
  SCREENSHOT_BUTTON_SIZE * 1.3
);
/** Floating snapshot + reset on map overlay at `md+` (slightly larger targets). */
export const MAP_OVERLAY_FLOATING_TOOL_SIZE_DESKTOP = 40;
/**
 * Shared hit area for `.maplibregl-ctrl-group` zoom buttons and `MapOverlayToolsStack` (md+).
 * Keep in sync with `getNavigationControlStyles` in theme/mapStyles.ts.
 */
export const MAP_NAV_CONTROL_BUTTON_PX = 40;
/** Zoom glyph / overlay icon size (scales with button; baseline was 18×36). */
export const MAP_NAV_CONTROL_ICON_PX = Math.round(
  (18 * MAP_NAV_CONTROL_BUTTON_PX) / 36
);
