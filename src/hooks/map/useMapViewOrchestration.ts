import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { MapRef } from "react-map-gl/maplibre";
import { useTheme } from "@mui/material/styles";

import type { Town } from "@/common/types";
import { useMapStyleMode } from "@/context/MapStyleContext";
import { useAnimateCameraToFit } from "./camera/useAnimateCameraToFit";
import { useMapContainerResize } from "./runtime/useMapContainerResize";
import { useMapStyleSwitchLoader } from "./runtime/useMapStyleSwitchLoader";
import { useMapViewLibreEffects } from "./runtime/useMapViewLibreEffects";
import { useTownsGeoJSON } from "./data/useTownsGeoJSON";
import { useMapViewState, type MapViewState } from "./camera/useMapViewState";
import { usePrefersReducedMotion, useViewport } from "@/hooks/ui";
import { getMapStyles } from "@/constants/ui";
import {
  getMapDescription,
  getPopulationOverlayStyle,
  getTerrainStyle,
  warmupStadiaStyleMetadata,
} from "@/utils/map";

import { useMapCameraLifecycle } from "./camera/useMapCameraLifecycle";
import {
  useMapViewConfig,
  useSharedViewProps,
} from "./camera/useMapViewConfig";
import { useMapViewInteractions } from "./interactions/useMapViewInteractions";

export type MapLibreMaxBounds = [[number, number], [number, number]];

/** Props threaded from `MapView` into {@link useMapViewOrchestration}. */
export interface MapViewComponentProps {
  towns: Town[];
  selectedYear: number;
  initialPosition: Pick<MapViewState, "longitude" | "latitude">;
  initialZoom: number;
  maxBounds?: MapLibreMaxBounds;
  fallbackMapSize?: { effectiveWidth: number; effectiveHeight: number };
  onFirstIdle?: () => void;
  showOverlayButtons?: boolean;
  isResizing?: boolean;
}

/**
 * Composes **MapView** behavior: camera state, fit animations, container resize, basemap style
 * switching, GeoJSON, keyboard/controls accessibility, and MapLibre load/idle hooks. Split-basemap
 * (dark mode) wires a second map ref and paired idle handlers.
 *
 * Intended as the single integration point between `MapView` UI and the hooks under
 * `hooks/map/{camera,runtime,interactions,data}`.
 *
 * @param props - Threaded from `MapView` (towns, year, seed camera, bounds, layout flags).
 * @param props.towns - Filtered towns for the selected year (markers / GeoJSON).
 * @param props.selectedYear - Drives population attributes on GeoJSON features.
 * @param props.initialPosition - Seed longitude/latitude when props reset view state.
 * @param props.initialZoom - Seed zoom; clamped with {@link useMapViewConfig} when `maxBounds` is set.
 * @param props.maxBounds - Optional MapLibre bounds; affects min zoom and `sharedViewProps`.
 * @param props.fallbackMapSize - Optional precomputed map area when container is not measured yet.
 * @param props.onFirstIdle - Once per session, when overlay map first idles (e.g. layout perf).
 * @param props.showOverlayButtons - Shell chrome (e.g. screenshot); forwarded to shell props.
 * @param props.isResizing - Layout drag; {@link useMapCameraLifecycle} may refit when it ends.
 * @returns `shellProps` for the map chrome wrapper; `canvasStackProps` for the MapLibre stack
 *   (refs, styles, handlers, GeoJSON, interaction flags).
 */
export function useMapViewOrchestration({
  towns,
  selectedYear,
  initialPosition: { longitude, latitude },
  initialZoom,
  maxBounds,
  fallbackMapSize: fallbackMapSizeProp,
  onFirstIdle,
  showOverlayButtons = true,
  isResizing = false,
}: MapViewComponentProps) {
  const theme = useTheme();
  const { mode: mapStyleMode, toggleMode: toggleBasemapMode } =
    useMapStyleMode();
  const viewport = useViewport();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { isMobile, isDesktop, isTablet } = viewport;
  const mapRef = useRef<MapRef>(null);
  const basemapMapRef = useRef<MapRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const isSplitBasemap = mapStyleMode === "dark";
  const containerSize = useMapContainerResize(
    containerRef,
    mapRef,
    isSplitBasemap ? basemapMapRef : undefined
  );
  const enableZoomControls = !isMobile;
  const showZoomButtons = isDesktop;
  const { safeProps, effectiveMinZoom } = useMapViewConfig({
    longitude,
    latitude,
    initialZoom,
    maxBounds,
    containerSize,
    fallbackMapSize: fallbackMapSizeProp,
    screenWidth: viewport.screenWidth,
    screenHeight: viewport.screenHeight,
    theme,
  });

  const {
    viewState,
    handleMove,
    cameraFitTarget,
    onCameraFitComplete,
    syncViewStateFromMap,
    cameraFitTargetRefForSync,
    requestCameraFitTo,
  } = useMapViewState({
    longitude: safeProps.longitude,
    latitude: safeProps.latitude,
    zoom: safeProps.zoom,
  });

  useAnimateCameraToFit({
    mapRef,
    secondaryMapRef: isSplitBasemap ? basemapMapRef : undefined,
    cameraFitTarget,
    onCameraFitComplete,
    syncViewStateFromMap,
    cameraFitTargetRefForSync,
    prefersReducedMotion,
  });

  const townsGeojson = useTownsGeoJSON(towns, selectedYear);

  useMapViewInteractions({
    mapRef,
    containerRef: containerRef as RefObject<HTMLElement>,
    enableZoomControls,
    showZoomButtons,
    prefersReducedMotion,
    toggleBasemapMode,
  });

  useMapCameraLifecycle({
    safeProps,
    effectiveMinZoom,
    requestCameraFitTo,
    viewState,
    mapReady,
    isResizing,
    containerSize,
  });

  const { handleOverlayMapLoad, handleBasemapLoad } = useMapViewLibreEffects({
    mapRef,
    basemapMapRef,
    mapReady,
    isSplitBasemap,
    viewState,
    maxBounds,
  });

  const handleMapLoad = useCallback(() => {
    setMapLoaded(true);
    handleOverlayMapLoad();
  }, [handleOverlayMapLoad]);

  const { isStyleSwitching, onOverlayIdle, onBasemapIdle } =
    useMapStyleSwitchLoader({
      mapStyleMode,
      onFirstIdle,
    });

  useEffect(() => {
    warmupStadiaStyleMetadata();
  }, []);

  const handleMapIdle = useCallback(() => {
    setMapReady(true);
    onOverlayIdle();
  }, [onOverlayIdle]);

  const mapDescription = useMemo(
    () => getMapDescription({ isMobile, isDesktop, mapStyleMode }),
    [isMobile, isDesktop, mapStyleMode]
  );

  const overlayMapStyle = useMemo(
    () =>
      isSplitBasemap
        ? getPopulationOverlayStyle({
            includeWaterNameLayer: false,
          })
        : getTerrainStyle(),
    [isSplitBasemap]
  );
  const sharedViewProps = useSharedViewProps(
    viewState,
    maxBounds,
    effectiveMinZoom
  );

  const atMinZoom = viewState.zoom <= effectiveMinZoom;
  const mapStyles = useMemo(() => getMapStyles(theme), [theme]);

  const shellProps = {
    mapStyles,
    atMinZoom,
    mapDescription,
    mapStyleMode,
    showOverlayButtons,
    isStyleSwitching,
    mapReady,
    containerRef,
  };

  const canvasStackProps = {
    isSplitBasemap,
    mapLoaded,
    basemapMapRef,
    mapRef,
    sharedViewProps,
    onBasemapLoad: handleBasemapLoad,
    onBasemapIdle,
    effectiveMinZoom,
    handleMove: (nextViewState: MapViewState) =>
      handleMove({ viewState: nextViewState }),
    onOverlayLoad: handleMapLoad,
    onOverlayIdle: handleMapIdle,
    overlayMapStyle,
    enableZoomControls,
    townsGeojson,
    mapStyleMode,
    mapReady,
    towns,
    selectedYear,
    showOverlayButtons,
    showZoomButtons,
    isTablet,
    isMobile,
  };

  return { shellProps, canvasStackProps };
}

export type MapViewOrchestrationResult = ReturnType<
  typeof useMapViewOrchestration
>;
