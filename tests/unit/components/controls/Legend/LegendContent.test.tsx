import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import theme from "@/theme/theme";
import { LegendContent } from "@/components/legend";
import type { LayerItem } from "@/common/types";

/**
 * Desktop smoke tests for LegendContent with layout mocked.
 * Responsive header modes and real useLegendLayout wiring live in
 * tests/integration/LegendResponsive.integration.test.tsx.
 * Full-browser mobile/tablet behaviour is covered by
 * tests/e2e/legend-responsive.spec.ts.
 */

const wrap = (ui: React.ReactElement) =>
  React.createElement(ThemeProvider, { theme }, ui);

vi.mock("@/context/MapStyleContext", () => ({
  useMapStyleMode: () => ({
    mode: "light" as const,
    setMode: vi.fn(),
    toggleMode: vi.fn(),
  }),
}));

vi.mock("@/hooks/ui", async () => {
  const { createResponsiveMock } =
    await import("../../../../helpers/mocks/responsive");
  return {
    useResponsive: vi.fn(() => createResponsiveMock()),
    useViewport: vi.fn(() => ({
      isTablet: false,
      isMobile: false,
      isDesktop: true,
      isXLarge: false,
      screenWidth: 1200,
      screenHeight: 800,
      rawScreenWidth: 1200,
      rawScreenHeight: 800,
      isMobileLayout: false,
      isTabletLayout: false,
      isDesktopLayout: true,
      isXLargeLayout: false,
      isBelowMinViewport: false,
    })),
    useResizeDebounced: vi.fn(() => false),
  };
});

vi.mock("@/constants/sizing", () => ({
  getLegendStyles: () => ({
    itemText: {},
    attributionLinks: {},
  }),
}));

vi.mock("@/components/legend/useLegendLayout", () => ({
  useLegendLayout: () => ({
    appTitleStyle: {},
    titleStyle: {},
    subtitleStyle: {},
    stackStyles: { layoutMode: "grid", sx: {} },
    isMobileLayout: false,
    isTabletLayout: false,
    isMapIdle: true,
    splitNoDataBand: false,
    useCompactLegendHeader: false,
    useTabletControlGrid: false,
    headerPadding: { px: 2, py: 1.5 },
    collapseIconButton: { size: 32, iconFontSize: 20 },
    infoAccent: "#0288d1",
  }),
}));

vi.mock("@/components/ui", () => ({
  AttributionLinks: () => (
    <div data-testid="attribution-links">Attribution</div>
  ),
}));

const defaultLayers: LayerItem[] = [
  { layer: "0–1k", color: "#abc" },
  { layer: "1k–5k", color: "#def" },
  { layer: "5k+", color: "#123" },
];

describe("LegendContent (desktop smoke)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when layers is empty or undefined", () => {
    const { container } = render(
      wrap(<LegendContent layers={[]} label="Population" selectedYear={1000} />)
    );
    expect(container.firstChild).toBeNull();

    const { container: c2 } = render(
      wrap(
        <LegendContent
          layers={undefined as unknown as LayerItem[]}
          label="Population"
          selectedYear={1000}
        />
      )
    );
    expect(c2.firstChild).toBeNull();
  });

  it("renders heading and layer list with labels", () => {
    render(
      wrap(
        <LegendContent
          layers={defaultLayers}
          label="Town size by population"
          selectedYear={1200}
        />
      )
    );

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Town size by population"
    );
    expect(screen.getByText("European towns, 800–1750")).toBeInTheDocument();
    expect(screen.getByText("0–1k")).toBeInTheDocument();
    expect(screen.getByText("1k–5k")).toBeInTheDocument();
    expect(screen.getByText("5k+")).toBeInTheDocument();
  });

  it("renders subtitle and attribution when isMapIdle is true", () => {
    render(
      wrap(
        <LegendContent
          layers={defaultLayers}
          label="Legend"
          selectedYear={1000}
          isMapIdle={true}
        />
      )
    );

    expect(screen.getByText("1000s")).toBeInTheDocument();
    expect(screen.getByTestId("attribution-links")).toBeInTheDocument();
  });

  it("shows layer stack, year, and attribution while loading when isMapIdle is false", () => {
    render(
      wrap(
        <LegendContent
          layers={defaultLayers}
          label="Legend"
          selectedYear={1000}
          isMapIdle={false}
        />
      )
    );

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Legend"
    );
    expect(screen.getByText("1000s")).toBeInTheDocument();
    expect(screen.getByTestId("attribution-links")).toBeInTheDocument();
    expect(screen.getByText("0–1k")).toBeInTheDocument();
    expect(screen.getByText("1k–5k")).toBeInTheDocument();
    expect(screen.getByText("5k+")).toBeInTheDocument();
  });

  it("uses section with aria-labelledby for accessibility", () => {
    render(
      wrap(
        <LegendContent
          layers={defaultLayers}
          label="Population"
          selectedYear={800}
        />
      )
    );

    const section = document.querySelector(
      'section[aria-labelledby="legend-heading"]'
    );
    expect(section).toBeInTheDocument();
    expect(document.getElementById("legend-heading")).toHaveTextContent(
      "Population"
    );
    expect(screen.getByText("~800 AD")).toBeInTheDocument();
  });

  it("toggles collapse button aria-expanded state on click", () => {
    render(
      wrap(
        <LegendContent
          layers={defaultLayers}
          label="Population"
          selectedYear={1000}
        />
      )
    );

    const collapseButton = screen.getByRole("button", {
      name: "Collapse legend",
    });
    expect(collapseButton).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(collapseButton);
    expect(collapseButton).toHaveAttribute("aria-expanded", "false");
  });
});
