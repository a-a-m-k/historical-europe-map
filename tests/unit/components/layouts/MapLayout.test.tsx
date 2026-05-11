import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { APP_MIN_WIDTH } from "@/constants";
import { MapLayout } from "@/components/layouts/MapLayout";

const mapStageSpy = vi.hoisted(() => vi.fn());

const appState = vi.hoisted(() => ({
  towns: [],
  filteredTowns: [],
  selectedYear: 800,
  isYearDataLoading: false,
  yearDataError: null as string | null,
  retryYearData: vi.fn(),
}));

const viewportState = vi.hoisted(() => ({
  rawScreenWidth: 1024,
  isBelowMinViewport: false,
}));

const overlayState = vi.hoisted(() => ({
  showOverlayButtons: true,
  isResizing: false,
}));
const activationState = vi.hoisted(() => ({
  isMapActivated: true,
}));

vi.mock("@/context/AppContext", () => ({
  useApp: () => appState,
}));

vi.mock("@/hooks/ui", () => ({
  useViewport: () => ({
    rawScreenWidth: viewportState.rawScreenWidth,
    isBelowMinViewport: viewportState.isBelowMinViewport,
    isMobile: false,
    isTablet: false,
    screenWidth: 1024,
    screenHeight: 768,
  }),
  useNarrowLayout: () => false,
  useOverlayButtonsVisible: () => overlayState,
}));

vi.mock("@/hooks/map", () => ({
  useInitialMapState: () => ({
    center: { latitude: 48.8566, longitude: 2.3522 },
    fitZoom: 6,
    bounds: undefined,
  }),
  useStableMapKey: () => "desktop",
  MAP_ACTIVATION_MARK: "map-activation",
  MAP_ACTIVATION_TO_IDLE_MEASURE: "map-activation-to-idle",
  MAP_FIRST_IDLE_MARK: "map-first-idle",
  markPerformance: vi.fn(),
  measurePerformance: vi.fn(),
  useMapActivationGate: () => ({
    isMapActivated: activationState.isMapActivated,
    mapMountGateRef: { current: null },
  }),
}));

vi.mock("@/components/layouts/MapLegendColumn", () => ({
  MapLegendColumn: () => <div data-testid="legend-panel">MapLegendColumn</div>,
}));

vi.mock("@/components/layouts/MapStage", () => ({
  MapStage: (props: Record<string, unknown>) => {
    mapStageSpy(props);
    return <div data-testid="map-stage">MapStage</div>;
  },
}));

vi.mock("@/components/ui", () => ({
  LoadingSpinner: ({ message }: { message: string }) => (
    <div data-testid="loading-spinner">{message}</div>
  ),
  ErrorOverlay: ({ message }: { message: string }) => (
    <div data-testid="error-overlay">{message}</div>
  ),
}));

describe("MapLayout", () => {
  const legendLayers = [{ layer: "small", color: "#f00" }];
  const marks = [{ value: 800, label: "9th ct." }];

  beforeEach(() => {
    vi.clearAllMocks();
    appState.towns = [];
    appState.filteredTowns = [];
    appState.selectedYear = 800;
    appState.isYearDataLoading = false;
    appState.yearDataError = null;
    viewportState.rawScreenWidth = 1024;
    viewportState.isBelowMinViewport = false;
    overlayState.showOverlayButtons = true;
    overlayState.isResizing = false;
    activationState.isMapActivated = true;
    document.documentElement.style.removeProperty("--app-min-width");
  });

  it("sets and removes --app-min-width on mount lifecycle", () => {
    activationState.isMapActivated = false;
    const { unmount } = render(
      <MapLayout legendLayers={legendLayers} marks={marks} />
    );

    expect(
      document.documentElement.style.getPropertyValue("--app-min-width")
    ).toBe(`${APP_MIN_WIDTH}px`);

    unmount();
    expect(
      document.documentElement.style.getPropertyValue("--app-min-width")
    ).toBe("");
  });

  it("renders MapLegendColumn before MapStage", async () => {
    render(<MapLayout legendLayers={legendLayers} marks={marks} />);

    const legendPanel = screen.getByTestId("legend-panel");
    const mapStage = await screen.findByTestId("map-stage");
    expect(
      legendPanel.compareDocumentPosition(mapStage) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("passes showResizeSpinner=true to MapStage while resizing above min viewport", async () => {
    overlayState.isResizing = true;
    viewportState.isBelowMinViewport = false;

    render(<MapLayout legendLayers={legendLayers} marks={marks} />);

    await waitFor(() => expect(mapStageSpy).toHaveBeenCalled());
    const latestProps = mapStageSpy.mock.calls.at(-1)?.[0] as {
      showResizeSpinner: boolean;
    };
    expect(latestProps.showResizeSpinner).toBe(true);
  });

  it("shows historical loading overlay when app is loading with no filtered towns", () => {
    appState.isYearDataLoading = true;
    appState.filteredTowns = [];

    render(<MapLayout legendLayers={legendLayers} marks={marks} />);

    expect(screen.getByText("Loading historical data...")).toBeInTheDocument();
  });
});
