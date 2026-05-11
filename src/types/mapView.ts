import type { MapProps } from "react-map-gl/maplibre";

import type { LatLngTuple } from "@/common/types";

/** Camera + bounds props aligned with the interactive overlay (no `mapStyle`). */
export type MapViewSharedCameraProps = Pick<
  MapProps,
  "longitude" | "latitude" | "zoom" | "minZoom" | "maxZoom" | "maxBounds"
> & { maxBoundsViscosity?: number };

export interface MapContainerProps {
  center?: LatLngTuple;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  maxBounds?: [LatLngTuple, LatLngTuple];
  maxBoundsViscosity?: number;
}

export interface MapViewProps {
  initialPosition: { longitude: number; latitude: number };
  mapContainerProps?: MapContainerProps;
  initialZoom: number;
}
