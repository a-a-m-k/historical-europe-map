import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";

import { AttributionLinks } from "@/components/ui/AttributionLinks";
import theme from "@/theme/theme";
import { strings } from "@/locales";

const responsiveState = {
  rawScreenWidth: 1024,
  theme,
};

vi.mock("@/hooks/ui", () => ({
  useResponsive: () => responsiveState,
}));

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe("AttributionLinks", () => {
  beforeEach(() => {
    responsiveState.rawScreenWidth = 1024;
  });

  it("renders a single centered row on lg and below", () => {
    responsiveState.rawScreenWidth = 1100;

    renderWithTheme(<AttributionLinks />);

    expect(
      screen.getByRole("navigation", {
        name: strings.legend.attributionLinksAria,
      })
    ).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);
  });

  it("renders split rows for large screens", () => {
    responsiveState.rawScreenWidth = 1400;

    renderWithTheme(<AttributionLinks rowAlignment="center" />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link).toHaveAttribute(
        "aria-label",
        expect.stringContaining(strings.legend.opensInNewTab)
      );
    }
  });
});
