import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";

import { MapStyleToggle } from "@/components/map/MapView/MapStyleToggle";
import { strings } from "@/locales";
import theme from "@/theme/theme";

const toggleMode = vi.fn();
const modeState: { value: "light" | "dark" } = { value: "light" };

vi.mock("@/context/MapStyleContext", () => ({
  useMapStyleMode: () => ({
    mode: modeState.value,
    toggleMode,
    setMode: vi.fn(),
  }),
}));

describe("MapStyleToggle", () => {
  beforeEach(() => {
    toggleMode.mockReset();
    modeState.value = "light";
  });

  it("renders dark-mode action text while in light mode", () => {
    render(
      <ThemeProvider theme={theme}>
        <MapStyleToggle />
      </ThemeProvider>
    );

    const button = screen.getByTestId("map-style-toggle");
    expect(button).toHaveAttribute("aria-label", strings.map.mapStyleDarkAria);
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("renders light-mode action text while in dark mode", () => {
    modeState.value = "dark";
    render(
      <ThemeProvider theme={theme}>
        <MapStyleToggle />
      </ThemeProvider>
    );

    const button = screen.getByTestId("map-style-toggle");
    expect(button).toHaveAttribute("aria-label", strings.map.mapStyleLightAria);
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("toggles style on click", () => {
    render(
      <ThemeProvider theme={theme}>
        <MapStyleToggle />
      </ThemeProvider>
    );
    fireEvent.click(screen.getByTestId("map-style-toggle"));
    expect(toggleMode).toHaveBeenCalledTimes(1);
  });
});
