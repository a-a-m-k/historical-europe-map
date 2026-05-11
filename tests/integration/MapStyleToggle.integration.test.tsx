import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";

import { MapStyleProvider } from "@/context/MapStyleContext";
import { MapStyleToggle } from "@/components/map/MapView/MapStyleToggle";
import theme from "@/theme/theme";

describe("Map style toggle integration", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("toggles mode and persists selection through context", () => {
    render(
      <ThemeProvider theme={theme}>
        <MapStyleProvider>
          <MapStyleToggle />
        </MapStyleProvider>
      </ThemeProvider>
    );

    const toggle = screen.getByTestId("map-style-toggle");
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(window.localStorage.getItem("historical-europe-map-basemap-style")).toBe(
      "dark"
    );
  });
});
