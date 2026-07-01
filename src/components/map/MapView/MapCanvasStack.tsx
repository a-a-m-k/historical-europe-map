import React, { Suspense, useCallback, useMemo } from "react";
import Map from "react-map-gl/maplibre";

import { MAP_LAYER_ID } from "@/constants";
import type { MapViewState } from "@/hooks/map";
import {
  clampOverlayZoomToMin,
  getCanvasContextAttributes,
  getCanvasStyle,
  getMapFeatureName,
  handleMapFeatureClick,
  TILE_LOADING_OPTIONS,
  maplibreGl,
} from "@/utils/map";
import { isE2ePlaywrightDom } from "@/utils/e2eDom";
import type { MapCanvasStackProps } from "@/types/mapView";
import MapLayer from "./MapLayer/MapLayer";
import { MapOverlays } from "./MapOverlays";
import { useDeferredOverlayActivation } from "@/hooks/map";

const TownMarkers = React.lazy(() =>
  import("./TownMarkers").then(module => ({ default: module.TownMarkers }))
);

export const MapCanvasStack: React.FC<MapCanvasStackProps> = ({
  camera,
  overlay,
  towns,
  controls,
}) => {
  const {
    mapRef,
    sharedViewProps,
    effectiveMinZoom,
    onMove: handleMove,
  } = camera;
  const {
    onLoad: onOverlayLoad,
    onIdle: onOverlayIdle,
    mapStyle,
    loaded: mapLoaded,
    ready: mapReady,
  } = overlay;
  const {
    geojson: townsGeojson,
    towns: filteredTowns,
    selectedYear,
    styleMode: mapStyleMode,
  } = towns;
  const {
    enableZoom: enableZoomControls,
    showOverlayButtons,
    showZoomButtons,
    isTablet,
    isMobile,
  } = controls;

  const mapOverlaysGate = isE2ePlaywrightDom() || mapReady || mapLoaded;
  const deferredOverlays = useDeferredOverlayActivation(mapOverlaysGate);
  const shouldRenderOverlays = isE2ePlaywrightDom() || deferredOverlays;

  const handleOverlayMapMove = useCallback(
    (evt: { viewState: MapViewState }) => {
      handleMove(clampOverlayZoomToMin(evt.viewState, effectiveMinZoom));
    },
    [effectiveMinZoom, handleMove]
  );

  const handleOverlayMapClick = useCallback(
    (e: { features?: Array<{ properties?: GeoJSON.GeoJsonProperties }> }) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      handleMapFeatureClick(getMapFeatureName(feature.properties));
    },
    []
  );

  const mapCanvasContextAttributes = useMemo(
    () => getCanvasContextAttributes(),
    []
  );

  const mapCanvasStyle = useMemo(() => getCanvasStyle(), []);

  const interactiveLayerIds = useMemo(() => [`${MAP_LAYER_ID}-circle`], []);

  const mapInteractionProps = useMemo(() => {
    return {
      keyboard: enableZoomControls,
      scrollZoom: enableZoomControls,
      touchZoomRotate: true,
      dragPan: true,
    };
  }, [enableZoomControls]);

  const mapPerformanceProps = useMemo(() => {
    return {
      cancelPendingTileRequestsWhileZooming: true,
      maxTileCacheZoomLevels: TILE_LOADING_OPTIONS.maxTileCacheZoomLevels,
      maxTileCacheSize: TILE_LOADING_OPTIONS.maxTileCacheSize,
    };
  }, []);
  const { keyboard, scrollZoom, touchZoomRotate, dragPan } =
    mapInteractionProps;
  const {
    cancelPendingTileRequestsWhileZooming,
    maxTileCacheZoomLevels,
    maxTileCacheSize,
  } = mapPerformanceProps;

  return (
    <Map
      ref={mapRef}
      {...sharedViewProps}
      // Keep town-label collision within the GeoJSON source so basemap symbols
      // cannot suppress all custom town labels.
      crossSourceCollisions={false}
      onMove={handleOverlayMapMove}
      onLoad={onOverlayLoad}
      onIdle={onOverlayIdle}
      // Disable symbol/tile fade transitions so timeline `setData` updates do not
      // visually drop and re-fade labels on each year change.
      fadeDuration={0}
      onClick={handleOverlayMapClick}
      interactiveLayerIds={interactiveLayerIds}
      canvasContextAttributes={mapCanvasContextAttributes}
      style={mapCanvasStyle}
      mapStyle={mapStyle}
      mapLib={maplibreGl}
      attributionControl={false}
      cursor="pointer"
      keyboard={keyboard}
      scrollZoom={scrollZoom}
      touchZoomRotate={touchZoomRotate}
      dragPan={dragPan}
      cancelPendingTileRequestsWhileZooming={
        cancelPendingTileRequestsWhileZooming
      }
      maxTileCacheZoomLevels={maxTileCacheZoomLevels}
      maxTileCacheSize={maxTileCacheSize}
    >
      <MapLayer
        layerId={MAP_LAYER_ID}
        data={townsGeojson}
        mapStyleMode={mapStyleMode}
      />
      {mapReady && (
        <Suspense fallback={null}>
          <TownMarkers towns={filteredTowns} selectedYear={selectedYear} />
        </Suspense>
      )}
      {shouldRenderOverlays && (
        <MapOverlays
          showOverlayButtons={showOverlayButtons}
          showZoomButtons={showZoomButtons}
          isTablet={isTablet}
          isMobile={isMobile}
        />
      )}
    </Map>
  );
};
