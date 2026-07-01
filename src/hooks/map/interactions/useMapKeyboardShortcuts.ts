import { useEffect, RefObject } from "react";
import { MapRef } from "react-map-gl/maplibre";
import { dispatchMapResetCamera } from "@/utils/events/mapEvents";
import { ZOOM_ANIMATION_DURATION_MS } from "@/constants/keyboard";
import { logger } from "@/utils/logger";
import { isInputField } from "@/utils/keyboard";

/**
 * Global `keydown` listener for map zoom (Cmd/Ctrl+±, plain ±), **Shift+R** camera reset
 * (dispatches {@link dispatchMapResetCamera}), and **Cmd/Ctrl+Shift+N** basemap toggle.
 * Only handles keys when the event target is inside `#map-container-area` and not an input field.
 *
 * @param mapRef - MapLibre instance used for imperative `easeTo` zoom steps.
 * @param enabled - Typically desktop-only; when false, no listener is registered.
 * @param zoomDurationMs - MapLibre zoom duration; use `0` for reduced-motion users.
 * @param onToggleBasemapMode - Optional; required for night-mode shortcut to run.
 */
export const useMapKeyboardShortcuts = (
  mapRef: RefObject<MapRef>,
  enabled: boolean,
  zoomDurationMs: number = ZOOM_ANIMATION_DURATION_MS,
  onToggleBasemapMode?: () => void
) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const isEventWithinMapContainer = (target: EventTarget | null): boolean => {
      if (!(target instanceof Element)) return false;
      return Boolean(target.closest("#map-container-area"));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      if (target instanceof HTMLElement && isInputField(target)) {
        return;
      }

      const isNightBasemapToggle =
        e.shiftKey &&
        (e.metaKey || e.ctrlKey) &&
        e.code === "KeyN" &&
        !e.altKey;

      if (isNightBasemapToggle) {
        if (!onToggleBasemapMode) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation?.();
        onToggleBasemapMode();
        return;
      }

      const isResetView =
        e.shiftKey &&
        e.code === "KeyR" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey;

      if (isResetView) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation?.();
        dispatchMapResetCamera();
        return;
      }

      const isZoomIn =
        e.key === "=" ||
        e.key === "+" ||
        e.code === "Equal" ||
        e.code === "NumpadAdd" ||
        (e.shiftKey && e.key === "=");

      const isZoomOut =
        e.key === "-" ||
        e.key === "_" ||
        e.code === "Minus" ||
        e.code === "NumpadSubtract";

      if (!isZoomIn && !isZoomOut) return;
      const isModifiedShortcut = e.ctrlKey || e.metaKey;
      if (!isModifiedShortcut && !isEventWithinMapContainer(target)) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();

      const mapInstance = mapRef.current?.getMap();
      if (!mapInstance) {
        logger.warn("Map instance not available for zoom keyboard shortcut");
        return;
      }

      try {
        if (isZoomIn) {
          mapInstance.zoomIn({ duration: zoomDurationMs });
        } else if (isZoomOut) {
          mapInstance.zoomOut({ duration: zoomDurationMs });
        }
      } catch (error) {
        logger.error("Error handling zoom keyboard shortcut:", error);
      }
    };

    const keyboardListenerOptions: AddEventListenerOptions = {
      capture: true,
      passive: false,
    };
    window.addEventListener("keydown", handleKeyDown, keyboardListenerOptions);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
        keyboardListenerOptions
      );
    };
  }, [mapRef, enabled, zoomDurationMs, onToggleBasemapMode]);
};
