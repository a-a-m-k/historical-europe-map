import { useCallback, useEffect, useMemo, useRef } from "react";

import type { MapViewState } from "./useMapViewState";
import {
  dispatchMapCameraResetState,
  onMapResetCamera,
} from "@/utils/events/mapEvents";
import {
  createCameraResetTarget,
  isViewAtResetCamera,
  RESIZE_RECENTER_DELAY_MS,
} from "@/utils/map";

type SafeMapProps = {
  longitude: number;
  latitude: number;
  zoom: number;
};

type ContainerSize = {
  width: number;
  height: number;
};

type UseMapCameraLifecycleArgs = {
  safeProps: SafeMapProps;
  effectiveMinZoom: number;
  requestCameraFitTo: (target: SafeMapProps) => void;
  viewState: MapViewState;
  mapReady: boolean;
  isResizing: boolean;
  containerSize: ContainerSize | null;
};

/**
 * Keeps the camera aligned with the **reset** target derived from seed props + `effectiveMinZoom`.
 * **Sole owner of viewport resize refit:** listens for global reset events, debounces refits after
 * {@link useMapContainerResize} sees size changes, runs one fit when `mapReady` first gets real
 * dimensions, and refits when `isResizing` goes true → false. Seed props from `MapLayout` stay
 * frozen across resize; this hook recomputes the animated fit via `effectiveMinZoom` + container size.
 * Dispatches {@link dispatchMapCameraResetState} with whether `viewState` is already at the reset target
 * (for reset-button disabled state).
 *
 * @param safeProps - Sanitized lng/lat/zoom from {@link useMapViewConfig}.
 * @param effectiveMinZoom - Floor zoom when bounds constrain the camera.
 * @param requestCameraFitTo - From {@link useMapViewState}; triggers the same animation path as resize refit.
 * @param viewState - Live React map state for “at reset?” comparison.
 * @param mapReady - Overlay has idled at least once; gates initial dimension-based fit.
 * @param isResizing - Legend/timeline drag; refit when resize ends.
 * @param containerSize - Latest observed map container width/height.
 * @returns `isAtResetCamera` — whether current `viewState` matches the computed reset target
 *   (also dispatched via {@link dispatchMapCameraResetState} for the reset button).
 */
export const useMapCameraLifecycle = ({
  safeProps,
  effectiveMinZoom,
  requestCameraFitTo,
  viewState,
  mapReady,
  isResizing,
  containerSize,
}: UseMapCameraLifecycleArgs) => {
  const previousContainerSizeRef = useRef<ContainerSize | null>(null);
  const resizeRecenterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const hasRunInitialReadyFitRef = useRef(false);
  const previousIsResizingRef = useRef(isResizing);
  const resetCameraTarget = useMemo(
    () =>
      createCameraResetTarget(
        safeProps.longitude,
        safeProps.latitude,
        safeProps.zoom,
        effectiveMinZoom
      ),
    [safeProps.longitude, safeProps.latitude, safeProps.zoom, effectiveMinZoom]
  );

  const requestResetCamera = useCallback(() => {
    requestCameraFitTo(resetCameraTarget);
  }, [requestCameraFitTo, resetCameraTarget]);

  const scheduleResetCameraRefit = useCallback(() => {
    if (resizeRecenterTimeoutRef.current) {
      clearTimeout(resizeRecenterTimeoutRef.current);
    }
    resizeRecenterTimeoutRef.current = setTimeout(() => {
      resizeRecenterTimeoutRef.current = null;
      requestResetCamera();
    }, RESIZE_RECENTER_DELAY_MS);
  }, [requestResetCamera]);

  useEffect(() => {
    const cleanup = onMapResetCamera(requestResetCamera);
    return cleanup;
  }, [requestResetCamera]);

  useEffect(() => {
    const wasResizing = previousIsResizingRef.current;
    previousIsResizingRef.current = isResizing;
    if (!mapReady) return;
    // Fire when resize lifecycle finishes, even if observer size did not change.
    if (!wasResizing || isResizing) return;

    scheduleResetCameraRefit();
  }, [isResizing, mapReady, scheduleResetCameraRefit]);

  useEffect(() => {
    if (!containerSize || !mapReady) return;

    const previous = previousContainerSizeRef.current;
    previousContainerSizeRef.current = containerSize;

    // Skip first measurement: this is initial mount, not a user resize.
    if (!previous) return;

    const sizeChanged =
      previous.width !== containerSize.width ||
      previous.height !== containerSize.height;
    if (!sizeChanged) return;

    // Run the same camera-fit flow as the reset button after resize settles.
    scheduleResetCameraRefit();
  }, [containerSize, mapReady, scheduleResetCameraRefit]);

  useEffect(() => {
    if (!mapReady || !containerSize) return;
    if (hasRunInitialReadyFitRef.current) return;
    hasRunInitialReadyFitRef.current = true;

    // After first idle on this mount, run one fit with final measured size.
    scheduleResetCameraRefit();
  }, [mapReady, containerSize, scheduleResetCameraRefit]);

  useEffect(() => {
    return () => {
      if (resizeRecenterTimeoutRef.current) {
        clearTimeout(resizeRecenterTimeoutRef.current);
        resizeRecenterTimeoutRef.current = null;
      }
    };
  }, []);

  const isAtResetCamera = isViewAtResetCamera(viewState, resetCameraTarget);

  useEffect(() => {
    dispatchMapCameraResetState({ isAtResetCamera });
  }, [isAtResetCamera]);

  return { isAtResetCamera };
};
