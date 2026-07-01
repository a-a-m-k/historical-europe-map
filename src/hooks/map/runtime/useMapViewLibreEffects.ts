import {
  useCallback,
  useEffect,
  useRef,
  type RefObject,
} from "react";
import type { MapRef } from "react-map-gl/maplibre";
import type { MapViewState } from "../camera/useMapViewState";

type MapInstance = NonNullable<ReturnType<MapRef["getMap"]>>;

type MapLibreMaxBounds = [[number, number], [number, number]];

interface UseMapViewLibreEffectsParams {
  mapRef: RefObject<MapRef | null>;
  mapReady: boolean;
  viewState: MapViewState;
  maxBounds: MapLibreMaxBounds | undefined;
}

/**
 * Imperative MapLibre setup for `MapView`: applies max bounds, disables tile prefetch on load,
 * re-applies max bounds when the prop changes, and **re-syncs the map camera to React `viewState`**
 * after `style.load` (so light/dark `setStyle` swaps do not leave the GL map centered elsewhere).
 *
 * @param mapRef - Interactive map ref.
 * @param mapReady - Gate style listeners until the map has reported ready.
 * @param viewState - Latest React view state (kept in a ref for event handlers).
 * @param maxBounds - Optional MapLibre max bounds applied when provided.
 * @returns `handleOverlayMapLoad` to pass to the map `onLoad` handler.
 */
export function useMapViewLibreEffects({
  mapRef,
  mapReady,
  viewState,
  maxBounds,
}: UseMapViewLibreEffectsParams) {
  const viewStateRef = useRef(viewState);
  viewStateRef.current = viewState;

  const maxBoundsRef = useRef(maxBounds);
  maxBoundsRef.current = maxBounds;

  const applyMapLoad = useCallback((map: MapInstance) => {
    const mapWithPrefetchControl = map as MapInstance & {
      setPrefetchZoomDelta?: (delta: number) => void;
    };
    mapWithPrefetchControl.setPrefetchZoomDelta?.(0);
    if (maxBoundsRef.current) map.setMaxBounds(maxBoundsRef.current);
  }, []);

  const syncMapToViewStateRef = useCallback(() => {
    const vs = viewStateRef.current;
    const center: [number, number] = [vs.longitude, vs.latitude];
    mapRef.current?.getMap?.()?.jumpTo({ center, zoom: vs.zoom });
  }, [mapRef]);

  useEffect(() => {
    if (!maxBounds) return;
    mapRef.current?.getMap()?.setMaxBounds(maxBounds);
  }, [maxBounds, mapRef]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current?.getMap?.();
    if (!map) return;

    const onStyleLoad = () => {
      requestAnimationFrame(() => syncMapToViewStateRef());
    };

    map.on("style.load", onStyleLoad);
    return () => {
      map.off("style.load", onStyleLoad);
    };
  }, [mapReady, syncMapToViewStateRef, mapRef]);

  const handleOverlayMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) applyMapLoad(map);
  }, [applyMapLoad, mapRef]);

  return {
    handleOverlayMapLoad,
  };
}
