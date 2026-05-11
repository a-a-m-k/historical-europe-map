import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { MapViewShell } from "@/components/map/MapView/MapViewShell";

describe("MapViewShell accessibility", () => {
  it("exposes accessible map region semantics", () => {
    render(
      <MapViewShell
        mapStyles=""
        atMinZoom={false}
        mapDescription="Interactive population map"
        mapStyleMode="light"
        showOverlayButtons={true}
        isStyleSwitching={false}
        mapReady={true}
        containerRef={{ current: null }}
      >
        <div data-testid="map-content">Map content</div>
      </MapViewShell>
    );

    const mapRegion = screen.getByRole("application");
    expect(mapRegion).toHaveAttribute("aria-label");
    expect(mapRegion).toHaveAttribute("aria-describedby", "map-description");
    expect(mapRegion).toHaveAttribute("tabindex", "0");
    expect(screen.getByText("Interactive population map")).toHaveAttribute(
      "id",
      "map-description"
    );
    expect(screen.getByTestId("map-content")).toBeInTheDocument();
  });

  it("sets busy state while style is switching", () => {
    render(
      <MapViewShell
        mapStyles=""
        atMinZoom={false}
        mapDescription="Map description"
        mapStyleMode="dark"
        showOverlayButtons={true}
        isStyleSwitching={true}
        mapReady={false}
        containerRef={{ current: null }}
      >
        <div>Map content</div>
      </MapViewShell>
    );

    const mapRegion = screen.getByRole("application");
    expect(mapRegion).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Switching map style...")).toBeInTheDocument();
  });
});
