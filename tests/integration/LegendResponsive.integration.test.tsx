import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";

import Legend from "@/components/legend/Legend";
import { LegendContent } from "@/components/legend/LegendContent";
import { MapStyleProvider } from "@/context/MapStyleContext";
import theme from "@/theme/theme";
import type { LayerItem } from "@/common/types";
import {
  legendViewports,
  type LegendViewportPreset,
} from "../helpers/mocks/legendViewports";

const layers: LayerItem[] = [
  { layer: "5k-20k", color: "#cccccc" },
  { layer: "20k-50k", color: "#9ba7b8" },
  { layer: "No data", color: "#ffffff", variant: "noData" },
];

let activeViewport: LegendViewportPreset = "desktop";

vi.mock("@/components/controls/ScreenshotButton/ScreenshotButton", () => ({
  default: ({ variant }: { variant?: string }) => (
    <button
      type="button"
      data-testid="screenshot-button"
      data-variant={variant === "inline" ? "inline" : undefined}
    >
      Screenshot
    </button>
  ),
}));

vi.mock("@/hooks/ui", async importOriginal => {
  const actual = await importOriginal<typeof import("@/hooks/ui")>();
  const toViewport = (preset: LegendViewportPreset) => {
    const v = legendViewports[preset];
    return {
      isMobile: v.isMobile,
      isTablet: v.isTablet,
      isDesktop: v.isDesktop,
      isXLarge: v.isXLarge,
      isMobileLayout: v.isMobileLayout,
      isTabletLayout: v.isTabletLayout,
      isDesktopLayout: v.isDesktopLayout,
      isXLargeLayout: v.isXLargeLayout,
      screenWidth: v.screenWidth,
      screenHeight: v.screenHeight,
      rawScreenWidth: v.rawScreenWidth,
      rawScreenHeight: v.rawScreenHeight,
      isBelowMinViewport: v.isBelowMinViewport,
    };
  };
  return {
    ...actual,
    useResponsive: () => legendViewports[activeViewport],
    useViewport: () => toViewport(activeViewport),
    useResizeDebounced: () => false,
    useScreenshot: () => ({
      captureScreenshot: vi.fn(),
      isCapturing: false,
    }),
  };
});

const wrapContent = (ui: React.ReactElement) => (
  <MapStyleProvider>
    <ThemeProvider theme={theme}>{ui}</ThemeProvider>
  </MapStyleProvider>
);

const wrapLegend = (ui: React.ReactElement) => (
  <ThemeProvider theme={theme}>{ui}</ThemeProvider>
);

describe("Legend responsive integration", () => {
  beforeEach(() => {
    activeViewport = "desktop";
  });

  it("renders mobile legend with compact header, content, and collapse control", async () => {
    activeViewport = "mobile";

    render(
      wrapLegend(
        <Legend
          label="European population"
          layers={layers}
          selectedYear={1200}
        />
      )
    );

    expect(screen.getByTestId("legend-mobile")).toBeInTheDocument();
    expect(
      document.querySelector('[data-legend-header="compact"]')
    ).toBeInTheDocument();
    expect(screen.getByText("European towns, 800–1750")).toBeInTheDocument();
    expect(screen.getByText("1200s")).toBeInTheDocument();

    const collapseButton = screen.getByRole("button", {
      name: /expand legend/i,
    });
    expect(collapseButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(collapseButton);
    await waitFor(() =>
      expect(collapseButton).toHaveAttribute("aria-expanded", "true")
    );

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "European population"
    );
    expect(screen.getByText("5k-20k")).toBeInTheDocument();
    expect(screen.getByText("No data")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /stadia maps/i })).toBeInTheDocument();

    fireEvent.click(collapseButton);
    await waitFor(() =>
      expect(collapseButton).toHaveAttribute("aria-expanded", "false")
    );
    expect(
      screen.getByRole("button", { name: /expand legend/i })
    ).toBeInTheDocument();
  });

  it("renders tablet compact header without inline map controls while loading", () => {
    activeViewport = "tablet";

    render(
      wrapContent(
        <LegendContent
          label="European population"
          layers={layers}
          selectedYear={1000}
          isMapIdle={false}
        />
      )
    );

    expect(
      document.querySelector('[data-legend-header="compact"]')
    ).toBeInTheDocument();
    expect(screen.getByText("1000s")).toBeInTheDocument();
    expect(screen.getByText("5k-20k")).toBeInTheDocument();

    const header = document.querySelector('[data-legend-header="compact"]');
    expect(header).toBeTruthy();
    expect(
      within(header as HTMLElement).queryByTestId("screenshot-button")
    ).not.toBeInTheDocument();
    expect(
      within(header as HTMLElement).queryByTestId("map-reset-view-button")
    ).not.toBeInTheDocument();
    expect(
      within(header as HTMLElement).queryByTestId("map-style-toggle")
    ).not.toBeInTheDocument();
  });

  it("renders tablet idle header with inline map controls in a balanced grid", async () => {
    activeViewport = "tablet";

    render(
      wrapContent(
        <LegendContent
          label="European population"
          layers={layers}
          selectedYear={1000}
          isMapIdle={true}
        />
      )
    );

    const header = document.querySelector('[data-legend-header="compact"]');
    expect(header).toBeTruthy();
    const headerQueries = within(header as HTMLElement);

    const screenshotButton = await headerQueries.findByTestId(
      "screenshot-button"
    );
    expect(screenshotButton).toHaveAttribute("data-variant", "inline");
    expect(headerQueries.getByTestId("map-reset-view-button")).toHaveAttribute(
      "data-variant",
      "inline"
    );
    expect(headerQueries.getByTestId("map-style-toggle")).toHaveAttribute(
      "data-variant",
      "inline"
    );
  });

  it("renders desktop header with centered title block and nowrap app title", () => {
    activeViewport = "desktop";

    render(
      wrapContent(
        <LegendContent
          label="European population"
          layers={layers}
          selectedYear={800}
        />
      )
    );

    const header = document.querySelector(
      '[data-legend-header="desktop"]'
    ) as HTMLElement | null;
    expect(header).toBeInTheDocument();
    expect(screen.getByText("~800 AD")).toBeInTheDocument();
    expect(screen.queryByTestId("screenshot-button")).not.toBeInTheDocument();

    const appTitle = document.querySelector(
      "[data-legend-app-title]"
    ) as HTMLElement | null;
    expect(appTitle).toBeInTheDocument();
    expect(appTitle).toHaveStyle({ whiteSpace: "nowrap" });
    expect(appTitle).toHaveTextContent("European towns, 800–1750");

    expect(
      document.querySelector("[data-legend-title-block]")
    ).toBeInTheDocument();

    const collapseButton = screen.getByRole("button", {
      name: /collapse legend/i,
    });
    const controlCluster = collapseButton.parentElement?.parentElement;
    expect(controlCluster?.parentElement).toBe(header);
    expect(controlCluster).toHaveStyle({ position: "absolute" });
    expect(header).toHaveStyle({ position: "relative" });
  });
});
