import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";

import Legend from "@/ui/legend/Legend";
import theme from "@/theme/theme";
import type { LayerItem } from "@/common/types";

const responsiveState = {
  isMobileLayout: false,
  isTabletLayout: false,
  isXLargeLayout: false,
  theme,
};

vi.mock("@/hooks/ui", () => ({
  useResponsive: () => responsiveState,
}));

vi.mock("@/ui/legend/LegendContent", () => ({
  LegendContent: ({ label }: { label: string }) => (
    <div data-testid="legend-content">{label}</div>
  ),
}));

const layers: LayerItem[] = [{ layer: "0-1k", color: "#abc" }];

const renderLegend = (props?: Partial<React.ComponentProps<typeof Legend>>) =>
  render(
    <ThemeProvider theme={theme}>
      <Legend
        label="Population"
        layers={layers}
        selectedYear={1200}
        {...props}
      />
    </ThemeProvider>
  );

describe("Legend", () => {
  beforeEach(() => {
    responsiveState.isMobileLayout = false;
    responsiveState.isTabletLayout = false;
    responsiveState.isXLargeLayout = false;
  });

  it("returns null when layers are empty", () => {
    const { container } = renderLegend({ layers: [] });
    expect(container.firstChild).toBeNull();
  });

  it("uses desktop test id by default", () => {
    renderLegend();
    expect(screen.getByTestId("legend")).toBeInTheDocument();
    expect(screen.getByTestId("legend-content")).toHaveTextContent(
      "Population"
    );
  });

  it("uses mobile test id on mobile layout", () => {
    responsiveState.isMobileLayout = true;
    renderLegend();
    expect(screen.getByTestId("legend-mobile")).toBeInTheDocument();
  });

  it("uses tablet test id on tablet layout", () => {
    responsiveState.isTabletLayout = true;
    renderLegend();
    expect(screen.getByTestId("legend-tablet")).toBeInTheDocument();
  });
});
