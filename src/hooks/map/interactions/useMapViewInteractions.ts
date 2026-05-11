import type { MutableRefObject, RefObject } from "react";
import type { MapRef } from "react-map-gl/maplibre";

import { useMapKeyboardPanning } from "./useMapKeyboardPanning";
import { useMapKeyboardShortcuts } from "./useMapKeyboardShortcuts";
import { useNavigationControlAccessibility } from "./useNavigationControlAccessibility";
import { ZOOM_ANIMATION_DURATION_MS } from "@/constants/keyboard";

type UseMapViewInteractionsArgs = {
  mapRef: MutableRefObject<MapRef | null>;
  containerRef: RefObject<HTMLElement>;
  enableZoomControls: boolean;
  showZoomButtons: boolean;
  prefersReducedMotion: boolean;
  toggleBasemapMode: () => void;
};

/**
 * Wires desktop map **keyboard and control** behavior in one place:
 * {@link useMapKeyboardShortcuts}, {@link useMapKeyboardPanning}, {@link useNavigationControlAccessibility}.
 *
 * @param mapRef - Interactive overlay `MapRef` (zoom/pan targets).
 * @param containerRef - DOM root for focus / nav control queries (often `#map-container-area`).
 * @param enableZoomControls - When false, shortcuts and arrow panning are off (e.g. mobile).
 * @param showZoomButtons - When false, skips nav-control DOM fixes (no visible +/- group).
 * @param prefersReducedMotion - Passed through as zoom duration `0` for instant keyboard zoom.
 * @param toggleBasemapMode - Cmd/Ctrl+Shift+N handler for night basemap.
 */
export function useMapViewInteractions({
  mapRef,
  containerRef,
  enableZoomControls,
  showZoomButtons,
  prefersReducedMotion,
  toggleBasemapMode,
}: UseMapViewInteractionsArgs): void {
  useMapKeyboardShortcuts(
    mapRef,
    enableZoomControls,
    prefersReducedMotion ? 0 : ZOOM_ANIMATION_DURATION_MS,
    toggleBasemapMode
  );
  useMapKeyboardPanning(mapRef, containerRef, enableZoomControls);
  useNavigationControlAccessibility(showZoomButtons, containerRef);
}
