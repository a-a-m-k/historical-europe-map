import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { MapStage } from "@/components/layouts/MapStage";

const mapViewSpy = vi.hoisted(() => vi.fn());

vi.mock("@/components/map/MapView/MapView", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mapViewSpy(props);
    return <div data-testid="map-view">Map view</div>;
  },
}));

const baseProps: React.ComponentProps<typeof MapStage> = {
  deviceKey: "desktop-1024x768",
  towns: [],
  selectedYear: 800,
  initialPosition: { latitude: 50, longitude: 10 },
  initialZoom: 4,
  maxBounds: undefined,
  mapArea: { effectiveWidth: 1024, effectiveHeight: 768 },
  handleFirstIdle: vi.fn(),
  showOverlayButtons: true,
  isResizing: false,
  showResizeSpinner: false,
};

describe("MapStage", () => {
  it("renders LazyMapView when mounted", async () => {
    render(<MapStage {...baseProps} />);
    expect(await screen.findByTestId("map-view")).toBeInTheDocument();
  });

  it("shows resizing overlay spinner when showResizeSpinner is true", async () => {
    render(<MapStage {...baseProps} showResizeSpinner />);
    expect(await screen.findByText("Resizing map...")).toBeInTheDocument();
  });

  it("passes map props through to MapView", async () => {
    render(
      <MapStage
        {...baseProps}
        showOverlayButtons={false}
        isResizing
        selectedYear={1200}
        initialZoom={5}
      />
    );

    await screen.findByTestId("map-view");
    const latestProps = mapViewSpy.mock.calls.at(-1)?.[0] as {
      selectedYear: number;
      initialZoom: number;
      showOverlayButtons: boolean;
      isResizing: boolean;
    };
    expect(latestProps.selectedYear).toBe(1200);
    expect(latestProps.initialZoom).toBe(5);
    expect(latestProps.showOverlayButtons).toBe(false);
    expect(latestProps.isResizing).toBe(true);
  });
});
