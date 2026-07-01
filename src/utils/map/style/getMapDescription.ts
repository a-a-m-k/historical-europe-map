import { strings } from "@/locales";
import type { MapBaseStyleMode } from "./terrainStyle";

export interface GetMapDescriptionOptions {
  isMobile: boolean;
  isDesktop: boolean;
  /** Basemap mode; affects spoken “grayscale” vs “full color” wording only. */
  mapStyleMode?: MapBaseStyleMode;
}

/**
 * Builds the screen-reader description string for the main map region (`aria-describedby`).
 * @param options - Layout flags and optional basemap mode.
 * @returns Full prose description including controls, pan/zoom hints, and save shortcut.
 */
export function getMapDescription(options: GetMapDescriptionOptions): string {
  const { isMobile, isDesktop, mapStyleMode = "light" } = options;
  const controls = [
    strings.map.descriptionControlsTimeline,
    ...(isMobile
      ? [
          strings.map.descriptionControlsSave,
          strings.map.descriptionControlsResetView,
        ]
      : [strings.map.descriptionControlsSave]),
    strings.map.descriptionControlsMapStyleToggle,
    ...(isDesktop ? [strings.map.descriptionControlsZoom] : []),
    strings.map.descriptionControlsMapArea,
    strings.map.descriptionControlsTownMarkers,
  ].join(", ");

  const basemapDescriptor =
    mapStyleMode === "dark"
      ? strings.map.descriptionBasemapDark
      : strings.map.descriptionBasemapLight;

  let text = `${strings.map.descriptionIntro} ${controls}. ${strings.map.descriptionBasemapPrefix} ${basemapDescriptor}. ${strings.map.descriptionTabFocus} ${strings.map.descriptionMarkerFocus}`;
  text += ` ${strings.map.descriptionShortcutSave}`;
  if (isDesktop) {
    text += ` ${strings.map.descriptionShortcutZoomDesktop}`;
    text += ` ${strings.map.descriptionShortcutResetDesktop}`;
    text += ` ${strings.map.descriptionShortcutBasemapDesktop}`;
  } else {
    text += ` ${strings.map.descriptionShortcutZoomTablet}`;
  }
  text += ` ${strings.map.descriptionMarkersColor}`;
  return text;
}
