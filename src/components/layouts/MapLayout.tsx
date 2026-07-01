import React, { useState, useEffect, useRef } from "react";
import Box from "@mui/material/Box";

import { LoadingSpinner, ErrorOverlay } from "@/components/ui";
import { APP_MIN_WIDTH, Z_INDEX } from "@/constants";
import { LayerItem, TimelineMark, Town } from "@/common/types";
import { useApp } from "@/context/AppContext";
import {
  useSeedMapCamera,
  useMapActivationGate,
  MAP_ACTIVATION_MARK,
  MAP_ACTIVATION_TO_IDLE_MEASURE,
  MAP_FIRST_IDLE_MARK,
  markPerformance,
  measurePerformance,
  useStableMapKey,
} from "@/hooks/map";
import {
  useViewport,
  useNarrowLayout,
  useOverlayButtonsVisible,
} from "@/hooks/ui";
import { strings } from "@/locales";
import { lightTheme } from "@/theme/theme";
import { calculateMapArea } from "@/utils/mapZoom";
import { getInitialMapProps } from "@/utils/map";
import { trackTiming } from "@/utils/observability";
import { MapLegendColumn } from "./MapLegendColumn";

const LazyMapStage = React.lazy(() =>
  import("./MapStage").then(module => ({ default: module.MapStage }))
);

export interface MapLayoutProps {
  legendLayers: LayerItem[];
  marks: TimelineMark[];
  /** Full town bundle for initial map fit; not year-filtered. */
  towns: Town[];
  showDefaultMap?: boolean;
  isTownsLoading?: boolean;
}

/**
 * Map page layout: legend column, timeline, map canvas region, and loading overlays.
 */
export const MapLayout: React.FC<MapLayoutProps> = ({
  legendLayers,
  marks,
  towns,
  showDefaultMap,
  isTownsLoading,
}) => {
  const { yearDataError, retryYearData, isYearDataRetryable } = useApp();
  const viewport = useViewport();
  const narrowLayout = useNarrowLayout(viewport.rawScreenWidth);
  const [isMapIdle, setIsMapIdle] = React.useState(false);
  const { showOverlayButtons, isResizing } =
    useOverlayButtonsVisible(isMapIdle);
  const { isMapActivated, mapMountGateRef } = useMapActivationGate();

  const deviceKey = useStableMapKey(viewport);
  const prevDeviceKeyRef = useRef(deviceKey);
  const [isRemounting, setIsRemounting] = useState(false);

  const showResizeSpinner =
    !viewport.isBelowMinViewport &&
    (prevDeviceKeyRef.current !== deviceKey || isRemounting || isResizing);

  useEffect(() => {
    if (prevDeviceKeyRef.current !== deviceKey) {
      prevDeviceKeyRef.current = deviceKey;
      setIsRemounting(true);
    }
  }, [deviceKey]);

  const handleFirstIdle = React.useCallback(() => {
    markPerformance(MAP_FIRST_IDLE_MARK);
    const activationToIdleMs = measurePerformance(
      MAP_ACTIVATION_TO_IDLE_MEASURE,
      MAP_ACTIVATION_MARK,
      MAP_FIRST_IDLE_MARK
    );
    if (activationToIdleMs !== null) {
      trackTiming("map_activation_to_first_idle_ms", activationToIdleMs, {
        activation_mode: "deferred",
      });
    }
    setIsMapIdle(true);
    setIsRemounting(false);
  }, []);

  /**
   * Use `lightTheme` for layout math only; spacing/breakpoints match `darkTheme`,
   * so toggling basemap mode does not trigger a refit.
   */
  const mapArea = React.useMemo(
    () =>
      calculateMapArea(viewport.screenWidth, viewport.screenHeight, lightTheme),
    [viewport.screenWidth, viewport.screenHeight]
  );
  const initialMapState = useSeedMapCamera(towns, deviceKey, mapArea);
  const shouldUseDefaultView =
    (showDefaultMap ?? false) || !initialMapState.center;
  const { initialPosition, initialZoom } = getInitialMapProps(
    shouldUseDefaultView,
    initialMapState
  );
  const showHistoricalLoadingOverlay = isTownsLoading ?? false;

  const maxBounds = React.useMemo(() => {
    const b = initialMapState.bounds;
    if (!b) return undefined;
    const valid =
      Number.isFinite(b.minLat) &&
      Number.isFinite(b.maxLat) &&
      Number.isFinite(b.minLng) &&
      Number.isFinite(b.maxLng);
    if (!valid) return undefined;
    return [
      [b.minLng, b.minLat],
      [b.maxLng, b.maxLat],
    ] as [[number, number], [number, number]];
  }, [initialMapState.bounds]);

  React.useEffect(() => {
    document.documentElement.style.setProperty(
      "--app-min-width",
      `${APP_MIN_WIDTH}px`
    );
    return () => {
      document.documentElement.style.removeProperty("--app-min-width");
    };
  }, []);

  return (
    <Box
      id="map-container"
      sx={{
        width: "100%",
        flex: 1,
        minHeight: 0,
        minWidth: viewport.isBelowMinViewport ? APP_MIN_WIDTH : undefined,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflowX: "auto",
      }}
    >
      <MapLegendColumn
        hasError={Boolean(yearDataError)}
        narrowLayout={narrowLayout}
        isResizing={isResizing}
        legendLayers={legendLayers}
        isMapIdle={isMapIdle}
        marks={marks}
      />
      {yearDataError && (
        <ErrorOverlay
          title={strings.errors.yearDataErrorTitle}
          message={yearDataError}
          onRetry={isYearDataRetryable ? retryYearData : undefined}
        />
      )}
      {!isMapActivated && (
        <Box
          ref={mapMountGateRef}
          sx={{
            position: "absolute",
            inset: 0,
            minHeight: 0,
            zIndex: Z_INDEX.MAP,
            overflowX: "auto",
          }}
        />
      )}
      {isMapActivated && (
        <React.Suspense
          fallback={<LoadingSpinner message={strings.loading.default} />}
        >
          <LazyMapStage
            deviceKey={deviceKey}
            initialPosition={initialPosition}
            initialZoom={initialZoom}
            maxBounds={maxBounds}
            mapArea={mapArea}
            handleFirstIdle={handleFirstIdle}
            showOverlayButtons={showOverlayButtons}
            isResizing={isResizing}
            showResizeSpinner={showResizeSpinner}
          />
        </React.Suspense>
      )}
      {/* Show full-screen data loading only when no towns are currently renderable. */}
      {showHistoricalLoadingOverlay && (
        <LoadingSpinner message={strings.loading.loadingHistoricalData} />
      )}
    </Box>
  );
};
