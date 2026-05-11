import React, { Suspense } from "react";
import Box from "@mui/material/Box";

import { ErrorBoundary } from "@/components/dev";
import { LoadingSpinner } from "@/components/ui";
import { Town } from "@/common/types";
import { Z_INDEX } from "@/constants";
import { strings } from "@/locales";

const LazyMapView = React.lazy(
  () => import("@/components/map/MapView/MapView")
);

type MapStageProps = {
  deviceKey: string;
  towns: Town[];
  selectedYear: number;
  initialPosition: { longitude: number; latitude: number };
  initialZoom: number;
  maxBounds?: [[number, number], [number, number]];
  mapArea: { effectiveWidth: number; effectiveHeight: number };
  handleFirstIdle: () => void;
  showOverlayButtons: boolean;
  isResizing: boolean;
  showResizeSpinner: boolean;
};

export const MapStage: React.FC<MapStageProps> = ({
  deviceKey,
  towns,
  selectedYear,
  initialPosition,
  initialZoom,
  maxBounds,
  mapArea,
  handleFirstIdle,
  showOverlayButtons,
  isResizing,
  showResizeSpinner,
}) => (
  <Box
    sx={{
      position: "absolute",
      inset: 0,
      minHeight: 0,
      zIndex: Z_INDEX.MAP,
      overflowX: "auto",
    }}
  >
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner message={strings.loading.default} />}>
        <LazyMapView
          key={deviceKey}
          towns={towns}
          selectedYear={selectedYear}
          initialPosition={initialPosition}
          initialZoom={initialZoom}
          maxBounds={maxBounds}
          fallbackMapSize={mapArea}
          onFirstIdle={handleFirstIdle}
          showOverlayButtons={showOverlayButtons}
          isResizing={isResizing}
        />
      </Suspense>
    </ErrorBoundary>
    {showResizeSpinner && (
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
        }}
      >
        <LoadingSpinner message={strings.loading.resizingMap} />
      </Box>
    )}
  </Box>
);
