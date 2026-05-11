import { useRef } from "react";

/** Device class for map `key` remounts on mobile / tablet / desktop breakpoint changes. */
export function getMapDeviceKey(viewport: {
  isMobile: boolean;
  isTablet: boolean;
}): string {
  if (viewport.isMobile) return "mobile";
  if (viewport.isTablet) return "tablet";
  return "desktop";
}

/**
 * Stable React **`key`** segment for the map subtree: tracks {@link getMapDeviceKey} when the
 * viewport is at or above the app minimum width; when squeezed below minimum (horizontal scroll
 * affordance), **freezes** the last device class so micro-resizes do not remount MapLibre.
 *
 * @param viewport - From {@link useViewport} / layout (mobile, tablet, desktop, below-min flag).
 * @returns `"mobile"` | `"tablet"` | `"desktop"` for use in `key={\`\${deviceKey}-...\`}`.
 */
export function useStableMapKey(viewport: {
  isMobile: boolean;
  isTablet: boolean;
  isBelowMinViewport: boolean;
}): string {
  const deviceKey = getMapDeviceKey(viewport);
  const lastKeyAboveMinRef = useRef(deviceKey);
  if (!viewport.isBelowMinViewport) {
    lastKeyAboveMinRef.current = deviceKey;
  }
  return viewport.isBelowMinViewport ? lastKeyAboveMinRef.current : deviceKey;
}
