import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type RefObject,
} from "react";
import type { MapRef } from "react-map-gl/maplibre";
import { muteBasemapWaterLabelsForSplitOverlay } from "@/utils/map/layers/mapLabelCollision";
import type { MapViewState } from "../camera/useMapViewState";

type MapInstance = NonNullable<ReturnType<MapRef["getMap"]>>;

type MapLibreMaxBounds = [[number, number], [number, number]];

interface UseMapViewLibreEffectsParams {
  mapRef: RefObject<MapRef | null>;
  basemapMapRef: RefObject<MapRef | null>;
  mapReady: boolean;
  isSplitBasemap: boolean;
  viewState: MapViewState;
  maxBounds: MapLibreMaxBounds | undefined;
}

/**
 * Imperative MapLibre setup for `MapView`: applies max bounds, disables tile prefetch on load,
 * re-applies max bounds when the prop changes, and **re-syncs the map camera to React `viewState`**
 * after `style.load` and when split-basemap mode toggles (so `setStyle` / style swaps do not leave
 * the GL map centered elsewhere). Split underlay also mutes conflicting water label layers.
 *
 * @param mapRef - Overlay map ref.
 * @param basemapMapRef - Dark-mode terrain underlay ref (optional logical use when `isSplitBasemap`).
 * @param mapReady - Gate style listeners until the overlay has reported ready.
 * @param isSplitBasemap - Whether two maps are stacked (camera must stay paired).
 * @param viewState - Latest React view state (kept in a ref for event handlers).
 * @param maxBounds - Optional MapLibre max bounds applied to both maps when provided.
 * @returns `handleOverlayMapLoad` / `handleBasemapLoad` to pass to `onLoad` handlers.
 */
export function useMapViewLibreEffects({
  mapRef,
  basemapMapRef,
  mapReady,
  isSplitBasemap,
  viewState,
  maxBounds,
}: UseMapViewLibreEffectsParams) {
  const viewStateRef = useRef(viewState);
  viewStateRef.current = viewState;

  const cameraSyncedForSplitBasemapRef = useRef(isSplitBasemap);
  const maxBoundsRef = useRef(maxBounds);
  maxBoundsRef.current = maxBounds;

  const applyMapLoad = useCallback((map: MapInstance) => {
    const mapWithPrefetchControl = map as MapInstance & {
      setPrefetchZoomDelta?: (delta: number) => void;
    };
    mapWithPrefetchControl.setPrefetchZoomDelta?.(0);
    if (maxBoundsRef.current) map.setMaxBounds(maxBoundsRef.current);
  }, []);

  const syncMapsToViewStateRef = useCallback(() => {
    const vs = viewStateRef.current;
    const center: [number, number] = [vs.longitude, vs.latitude];
    const overlay = mapRef.current?.getMap?.();
    overlay?.jumpTo({ center, zoom: vs.zoom });
    if (isSplitBasemap) {
      basemapMapRef.current?.getMap?.()?.jumpTo({ center, zoom: vs.zoom });
    }
  }, [isSplitBasemap, mapRef, basemapMapRef]);

  useEffect(() => {
    if (!maxBounds) return;
    mapRef.current?.getMap()?.setMaxBounds(maxBounds);
    if (isSplitBasemap) {
      basemapMapRef.current?.getMap()?.setMaxBounds(maxBounds);
    }
  }, [maxBounds, isSplitBasemap, mapRef, basemapMapRef]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current?.getMap?.();
    if (!map) return;

    const onStyleLoad = () => {
      requestAnimationFrame(() => syncMapsToViewStateRef());
    };

    map.on("style.load", onStyleLoad);
    return () => {
      map.off("style.load", onStyleLoad);
    };
  }, [mapReady, syncMapsToViewStateRef, mapRef]);

  useLayoutEffect(() => {
    if (cameraSyncedForSplitBasemapRef.current === isSplitBasemap) return;
    const map = mapRef.current?.getMap?.();
    if (!map || !mapReady) return;
    syncMapsToViewStateRef();
    cameraSyncedForSplitBasemapRef.current = isSplitBasemap;
  }, [isSplitBasemap, mapReady, syncMapsToViewStateRef, mapRef]);

  const handleOverlayMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) applyMapLoad(map);
  }, [applyMapLoad, mapRef]);

  const handleBasemapLoad = useCallback(() => {
    const basemap = basemapMapRef.current?.getMap();
    if (!basemap) return;
    applyMapLoad(basemap);
    const vs = viewStateRef.current;
    basemap.jumpTo({ center: [vs.longitude, vs.latitude], zoom: vs.zoom });
    muteBasemapWaterLabelsForSplitOverlay(basemap);
  }, [applyMapLoad, basemapMapRef]);

  return {
    handleOverlayMapLoad,
    handleBasemapLoad,
  };
}
