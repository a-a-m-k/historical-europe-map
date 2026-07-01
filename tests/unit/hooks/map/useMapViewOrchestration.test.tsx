import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { useMapViewOrchestration } from "@/hooks/map/useMapViewOrchestration";
import type { Town } from "@/common/types";
import { lightTheme } from "@/theme/theme";

const useMapContainerResizeMock = vi.hoisted(() => vi.fn());
const useMapCameraLifecycleMock = vi.hoisted(() => vi.fn());
const useMapViewStateMock = vi.hoisted(() => vi.fn());
const useMapViewInteractionsMock = vi.hoisted(() => vi.fn());
const useTownsGeoJSONMock = vi.hoisted(() => vi.fn());
const useAnimateCameraToFitMock = vi.hoisted(() => vi.fn());
const useMapViewLibreEffectsMock = vi.hoisted(() => vi.fn());
const useMapStyleSwitchLoaderMock = vi.hoisted(() => vi.fn());
const useMapViewConfigMock = vi.hoisted(() => vi.fn());
const useSharedViewPropsMock = vi.hoisted(() => vi.fn());

vi.mock("@mui/material/styles", async importOriginal => {
  const actual = await importOriginal<typeof import("@mui/material/styles")>();
  return {
    ...actual,
    useTheme: () => lightTheme,
  };
});

vi.mock("@/context/MapStyleContext", () => ({
  useMapStyleMode: () => ({
    mode: "light" as const,
    toggleMode: vi.fn(),
  }),
}));

vi.mock("@/hooks/ui", () => ({
  useViewport: () => ({
    isMobile: false,
    isDesktop: true,
    isTablet: false,
    screenWidth: 1440,
    screenHeight: 900,
    rawScreenWidth: 1440,
  }),
  usePrefersReducedMotion: () => false,
}));

vi.mock("@/hooks/map/runtime/useMapContainerResize", () => ({
  useMapContainerResize: useMapContainerResizeMock,
}));

vi.mock("@/hooks/map/camera/useMapCameraLifecycle", () => ({
  useMapCameraLifecycle: useMapCameraLifecycleMock,
}));

vi.mock("@/hooks/map/camera/useMapViewState", () => ({
  useMapViewState: useMapViewStateMock,
}));

vi.mock("@/hooks/map/interactions/useMapViewInteractions", () => ({
  useMapViewInteractions: useMapViewInteractionsMock,
}));

vi.mock("@/hooks/map/data/useTownsGeoJSON", () => ({
  useTownsGeoJSON: useTownsGeoJSONMock,
}));

vi.mock("@/hooks/map/camera/useAnimateCameraToFit", () => ({
  useAnimateCameraToFit: useAnimateCameraToFitMock,
}));

vi.mock("@/hooks/map/runtime/useMapViewLibreEffects", () => ({
  useMapViewLibreEffects: useMapViewLibreEffectsMock,
}));

vi.mock("@/hooks/map/runtime/useMapStyleSwitchLoader", () => ({
  useMapStyleSwitchLoader: useMapStyleSwitchLoaderMock,
}));

vi.mock("@/hooks/map/camera/useMapViewConfig", () => ({
  useMapViewConfig: useMapViewConfigMock,
  useSharedViewProps: useSharedViewPropsMock,
}));

vi.mock("@/utils/map", async importOriginal => {
  const actual = await importOriginal<typeof import("@/utils/map")>();
  return {
    ...actual,
    warmupStadiaStyleMetadata: vi.fn(),
  };
});

const makeTown = (name: string): Town => ({
  name,
  latitude: 48.8566,
  longitude: 2.3522,
  populationByYear: { "800": 10000 },
});

describe("useMapViewOrchestration smoke", () => {
  const requestCameraFitTo = vi.fn();
  const handleMove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    useMapContainerResizeMock.mockReturnValue({ width: 800, height: 600 });
    useMapCameraLifecycleMock.mockReturnValue({ isAtResetCamera: true });
    useMapViewStateMock.mockReturnValue({
      viewState: { longitude: 2.3522, latitude: 48.8566, zoom: 5 },
      handleMove,
      cameraFitTarget: null,
      onCameraFitComplete: vi.fn(),
      syncViewStateFromMap: vi.fn(),
      cameraFitTargetRefForSync: { current: null },
      requestCameraFitTo,
    });
    useTownsGeoJSONMock.mockReturnValue({
      type: "FeatureCollection",
      features: [],
    });
    useMapViewLibreEffectsMock.mockReturnValue({
      handleOverlayMapLoad: vi.fn(),
    });
    useMapStyleSwitchLoaderMock.mockReturnValue({
      isStyleSwitching: false,
      onOverlayIdle: vi.fn(),
    });
    useMapViewConfigMock.mockReturnValue({
      safeProps: { longitude: 2.3522, latitude: 48.8566, zoom: 5 },
      effectiveMinZoom: 3,
    });
    useSharedViewPropsMock.mockReturnValue({
      longitude: 2.3522,
      latitude: 48.8566,
      zoom: 5,
      minZoom: 3,
    });
  });

  it("wires resize, camera lifecycle, and view state into grouped props", () => {
    const { result } = renderHook(() =>
      useMapViewOrchestration({
        filteredTowns: [makeTown("Paris")],
        selectedYear: 800,
        initialPosition: { latitude: 48.8566, longitude: 2.3522 },
        initialZoom: 5,
        isResizing: true,
      })
    );

    expect(useMapContainerResizeMock).toHaveBeenCalled();
    expect(useMapCameraLifecycleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        requestCameraFitTo,
        isResizing: true,
        containerSize: { width: 800, height: 600 },
      })
    );
    expect(useMapViewInteractionsMock).toHaveBeenCalled();
    expect(useAnimateCameraToFitMock).toHaveBeenCalled();

    expect(result.current.shellProps).toEqual(
      expect.objectContaining({
        showOverlayButtons: true,
        mapReady: false,
      })
    );
    expect(result.current.canvasStackProps.camera.onMove).toBeDefined();
    expect(result.current.canvasStackProps.towns.towns).toHaveLength(1);
    expect(result.current.canvasStackProps.controls.enableZoom).toBe(true);
  });
});
