import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";

import { MapOverlays } from "@/components/map/MapView/MapOverlays";
import { lightTheme } from "@/theme/theme";

const navigationControlSpy = vi.hoisted(() => vi.fn());

vi.mock("react-map-gl/maplibre", () => ({
  NavigationControl: (props: Record<string, unknown>) => {
    navigationControlSpy(props);
    return <div data-testid="navigation-control" />;
  },
}));

vi.mock("@/components/controls/ScreenshotButton/ScreenshotButton", () => ({
  default: () => <button id="map-screenshot-button">Screenshot</button>,
}));

vi.mock("@/components/controls/MapResetViewButton/MapResetViewButton", () => ({
  MapResetViewButton: () => (
    <button id="map-reset-view-button">Reset View</button>
  ),
}));

vi.mock("@/components/map/MapView/MapStyleToggle", () => ({
  MapStyleToggle: () => <button id="map-style-toggle">Style Toggle</button>,
}));

describe("MapOverlays", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithTheme = (ui: React.ReactElement) =>
    render(<ThemeProvider theme={lightTheme}>{ui}</ThemeProvider>);

  it("renders floating controls on desktop and hides screenshot on mobile", async () => {
    const { rerender } = render(
      <ThemeProvider theme={lightTheme}>
        <MapOverlays
          showOverlayButtons
          showZoomButtons={false}
          isTablet={false}
          isMobile={false}
        />
      </ThemeProvider>
    );

    expect(
      await screen.findByRole("button", { name: "Screenshot" })
    ).toBeVisible();
    expect(
      await screen.findByRole("button", { name: "Reset View" })
    ).toBeVisible();
    expect(
      await screen.findByRole("button", { name: "Style Toggle" })
    ).toBeVisible();

    rerender(
      <ThemeProvider theme={lightTheme}>
        <MapOverlays
          showOverlayButtons
          showZoomButtons={false}
          isTablet={false}
          isMobile
        />
      </ThemeProvider>
    );
    expect(
      screen.queryByRole("button", { name: "Screenshot" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset View" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Style Toggle" })).toBeVisible();
  });

  it("omits floating tool stack on tablet", () => {
    renderWithTheme(
      <MapOverlays
        showOverlayButtons
        showZoomButtons={false}
        isTablet
        isMobile={false}
      />
    );

    expect(
      screen.queryByRole("button", { name: "Reset View" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Style Toggle" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Screenshot" })
    ).not.toBeInTheDocument();
  });

  it("renders navigation control only when zoom controls are enabled", () => {
    const { rerender } = renderWithTheme(
      <MapOverlays
        showOverlayButtons
        showZoomButtons
        isTablet={false}
        isMobile={false}
      />
    );
    expect(screen.getByTestId("navigation-control")).toBeVisible();
    expect(navigationControlSpy).toHaveBeenCalled();

    rerender(
      <ThemeProvider theme={lightTheme}>
        <MapOverlays
          showOverlayButtons
          showZoomButtons={false}
          isTablet={false}
          isMobile={false}
        />
      </ThemeProvider>
    );
    expect(screen.queryByTestId("navigation-control")).not.toBeInTheDocument();
  });
});
