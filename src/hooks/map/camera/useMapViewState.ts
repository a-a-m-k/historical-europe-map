import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";

export interface MapViewport {
  screenWidth: number;
  screenHeight: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/** Seed camera from layout / data; changes replace `viewState` via effect. */
interface UseMapViewStateProps {
  longitude: number;
  latitude: number;
  zoom: number;
}

export interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

/** Target camera for fit-to-view animation (e.g. after resize); same shape as MapViewState. */
export type CameraFitTarget = MapViewState;

interface UseMapViewStateReturn {
  viewState: MapViewState;
  handleMove: (evt: { viewState: MapViewState }) => void;
  cameraFitTarget: CameraFitTarget | null;
  onCameraFitComplete: () => void;
  syncViewStateFromMap: (state: CameraFitTarget) => void;
  cameraFitTargetRefForSync: React.RefObject<CameraFitTarget | null>;
  /** Animate camera to target (same pipeline as resize refit). */
  requestCameraFitTo: (target: CameraFitTarget) => void;
}

/**
 * Holds the React-controlled `viewState` for `react-map-gl` and coordinates **imperative** camera
 * fits (`requestCameraFitTo` → `cameraFitTarget`) with {@link useAnimateCameraToFit}.
 *
 * - `viewState` is reset from props whenever `longitude` / `latitude` / `zoom` change (e.g. data load).
 * - `handleMove` updates `viewState` from user pan/zoom.
 * - When a fit animation completes, `onCameraFitComplete` clears `cameraFitTarget` and stages the
 *   last target into `viewState` on the next tick (`pendingCameraFitTargetRef`) so state updates stay ordered.
 * - `cameraFitTargetRefForSync` mirrors the current fit target for the animation effect cleanup path.
 *
 * MapLayout breakpoint remounts are handled elsewhere; this hook only sees continuous `viewState` updates.
 *
 * @param longitude - Prop-synced longitude (sanitized upstream).
 * @param latitude - Prop-synced latitude.
 * @param zoom - Prop-synced zoom.
 * @returns See {@link UseMapViewStateReturn}; consumers wire `viewState` / `handleMove` to `Map`,
 *   and `cameraFitTarget` + refs to {@link useAnimateCameraToFit}.
 */
export function useMapViewState({
  longitude,
  latitude,
  zoom,
}: UseMapViewStateProps): UseMapViewStateReturn {
  const fitTargetFromProps = useMemo(
    () => ({ longitude, latitude, zoom }),
    [longitude, latitude, zoom]
  );

  const [viewState, setViewState] = useState(fitTargetFromProps);
  const [cameraFitTarget, setCameraFitTarget] =
    useState<CameraFitTarget | null>(null);
  const cameraFitTargetRef = useRef<CameraFitTarget | null>(null);
  const cameraFitTargetRefForSync = useRef<CameraFitTarget | null>(null);
  cameraFitTargetRefForSync.current = cameraFitTarget;
  /** When fit animation ends, apply this target to viewState (avoids setState inside setState). */
  const pendingCameraFitTargetRef = useRef<CameraFitTarget | null>(null);

  useEffect(() => {
    setViewState(fitTargetFromProps);
  }, [fitTargetFromProps]);

  useEffect(() => {
    if (
      cameraFitTarget === null &&
      pendingCameraFitTargetRef.current !== null
    ) {
      const target = pendingCameraFitTargetRef.current;
      pendingCameraFitTargetRef.current = null;
      setViewState(target);
    }
  }, [cameraFitTarget]);

  const handleMove = useCallback((evt: { viewState: MapViewState }) => {
    setViewState(evt.viewState);
  }, []);

  const onCameraFitComplete = useCallback(() => {
    cameraFitTargetRef.current = null;
    setCameraFitTarget(prev => {
      if (prev) pendingCameraFitTargetRef.current = prev;
      return null;
    });
  }, []);

  const syncViewStateFromMap = useCallback((state: CameraFitTarget) => {
    setViewState(state);
  }, []);

  const requestCameraFitTo = useCallback((target: CameraFitTarget) => {
    setCameraFitTarget(target);
  }, []);

  return {
    viewState,
    handleMove,
    cameraFitTarget,
    onCameraFitComplete,
    syncViewStateFromMap,
    cameraFitTargetRefForSync,
    requestCameraFitTo,
  };
}
