import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AppProvider, useApp } from "@/context/AppContext";
import { MapLayout } from "@/components/layouts/MapLayout";

const viewportState = vi.hoisted(() => ({
  rawScreenWidth: 1024,
  isBelowMinViewport: false,
}));

const overlayState = vi.hoisted(() => ({
  showOverlayButtons: true,
  isResizing: false,
}));

const yearControllerState = vi.hoisted(() => ({
  filteredTowns: [
    {
      name: "Paris",
      latitude: 48.8566,
      longitude: 2.3522,
      populationByYear: { "800": 1000 },
    },
  ],
  yearDataError: null as string | null,
}));

vi.mock("@/context/useYearDataController", () => ({
  useYearDataController: () => ({
    filteredTowns: yearControllerState.filteredTowns,
    yearDataError: yearControllerState.yearDataError,
    retryYearData: vi.fn(),
    isYearDataRetryable: false,
  }),
}));

vi.mock("@/hooks/map", () => ({
  useSeedMapCamera: () => ({
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
    isMapActivated: true,
    mapMountGateRef: { current: null },
  }),
}));

vi.mock("@/hooks/ui", async importOriginal => {
  const actual = await importOriginal<typeof import("@/hooks/ui")>();
  return {
    ...actual,
    useViewport: () => ({
      rawScreenWidth: viewportState.rawScreenWidth,
      isBelowMinViewport: viewportState.isBelowMinViewport,
      isMobile: false,
      isTablet: false,
      screenWidth: 1024,
      screenHeight: 768,
    }),
    useOverlayButtonsVisible: () => overlayState,
  };
});

vi.mock("@/components/controls", () => ({
  Legend: ({ selectedYear }: { selectedYear: number }) => (
    <div data-testid="legend-year">{selectedYear}</div>
  ),
  Timeline: () => {
    const { setSelectedYear } = useApp();
    return (
      <button type="button" onClick={() => setSelectedYear(1000)}>
        Set year 1000
      </button>
    );
  },
}));

vi.mock("@/components/layouts/MapStage", () => ({
  MapStage: () => {
    const { selectedYear } = useApp();
    return <div data-testid="map-stage-year">{String(selectedYear)}</div>;
  },
}));

function renderLayout() {
  return render(
    <AppProvider towns={yearControllerState.filteredTowns as never}>
      <MapLayout
        legendLayers={[{ layer: "small", color: "#f00" }]}
        marks={[
          { value: 800, label: "9th ct." },
          { value: 1000, label: "11th ct." },
        ]}
        towns={yearControllerState.filteredTowns as never}
        isTownsLoading={false}
      />
    </AppProvider>
  );
}

describe("MapLayout cross-flow integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    viewportState.rawScreenWidth = 1024;
    viewportState.isBelowMinViewport = false;
    overlayState.showOverlayButtons = true;
    overlayState.isResizing = false;
    yearControllerState.filteredTowns = [
      {
        name: "Paris",
        latitude: 48.8566,
        longitude: 2.3522,
        populationByYear: { "800": 1000 },
      },
    ];
    yearControllerState.yearDataError = null;
    document.body.removeAttribute("data-narrow-layout");
  });

  it("propagates timeline year changes to both legend and map stage", async () => {
    renderLayout();

    expect(screen.getByTestId("legend-year")).toHaveTextContent("800");
    expect(await screen.findByTestId("map-stage-year")).toHaveTextContent(
      "800"
    );

    fireEvent.click(screen.getByRole("button", { name: "Set year 1000" }));

    await waitFor(() => {
      expect(screen.getByTestId("legend-year")).toHaveTextContent("1000");
      expect(screen.getByTestId("map-stage-year")).toHaveTextContent("1000");
    });
  });

  it("shows and hides historical loading overlay across towns loading transition", async () => {
    yearControllerState.filteredTowns = [];
    const { rerender } = render(
      <AppProvider towns={yearControllerState.filteredTowns as never}>
        <MapLayout
          legendLayers={[{ layer: "small", color: "#f00" }]}
          marks={[
            { value: 800, label: "9th ct." },
            { value: 1000, label: "11th ct." },
          ]}
          towns={yearControllerState.filteredTowns as never}
          isTownsLoading
        />
      </AppProvider>
    );
    expect(screen.getByText("Loading historical data...")).toBeInTheDocument();

    yearControllerState.filteredTowns = [
      {
        name: "Paris",
        latitude: 48.8566,
        longitude: 2.3522,
        populationByYear: { "800": 1000 },
      },
    ];
    rerender(
      <AppProvider towns={yearControllerState.filteredTowns as never}>
        <MapLayout
          legendLayers={[{ layer: "small", color: "#f00" }]}
          marks={[
            { value: 800, label: "9th ct." },
            { value: 1000, label: "11th ct." },
          ]}
          towns={yearControllerState.filteredTowns as never}
          isTownsLoading={false}
        />
      </AppProvider>
    );

    await waitFor(() => {
      expect(
        screen.queryByText("Loading historical data...")
      ).not.toBeInTheDocument();
    });
  });

  it("keeps narrow-layout body flag consistent through resize threshold toggles", async () => {
    const { rerender } = renderLayout();
    expect(document.body.getAttribute("data-narrow-layout")).toBeNull();

    viewportState.rawScreenWidth = 260; // <= enter threshold
    rerender(
      <AppProvider towns={yearControllerState.filteredTowns as never}>
        <MapLayout
          legendLayers={[{ layer: "small", color: "#f00" }]}
          marks={[
            { value: 800, label: "9th ct." },
            { value: 1000, label: "11th ct." },
          ]}
          towns={yearControllerState.filteredTowns as never}
          isTownsLoading={false}
        />
      </AppProvider>
    );
    await waitFor(() => {
      expect(document.body.getAttribute("data-narrow-layout")).toBe("true");
    });

    viewportState.rawScreenWidth = 320; // >= leave threshold
    rerender(
      <AppProvider towns={yearControllerState.filteredTowns as never}>
        <MapLayout
          legendLayers={[{ layer: "small", color: "#f00" }]}
          marks={[
            { value: 800, label: "9th ct." },
            { value: 1000, label: "11th ct." },
          ]}
          towns={yearControllerState.filteredTowns as never}
          isTownsLoading={false}
        />
      </AppProvider>
    );

    await waitFor(() => {
      expect(document.body.getAttribute("data-narrow-layout")).toBeNull();
    });
  });
});
