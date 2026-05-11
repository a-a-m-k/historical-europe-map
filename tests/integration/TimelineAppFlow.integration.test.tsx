import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import Timeline from "@/components/controls/Timeline/Timeline";
import { AppProvider, useApp } from "@/context/AppContext";
import theme from "@/theme/theme";
import type { Town } from "@/common/types";

vi.mock("@mui/material/useMediaQuery", () => ({
  default: vi.fn(),
}));

const towns: Town[] = [
  {
    name: "Paris",
    latitude: 48.8566,
    longitude: 2.3522,
    populationByYear: {
      800: 10000,
      1200: 12000,
      1750: 18000,
    },
  },
];

const marks = [
  { value: 800, label: "800 AD" },
  { value: 1200, label: "1200 AD" },
  { value: 1750, label: "1750 AD" },
];

const SelectedYearProbe = () => {
  const { selectedYear } = useApp();
  return <div data-testid="selected-year">{selectedYear}</div>;
};

describe("Timeline + App context integration", () => {
  it("updates selected year through timeline controls", async () => {
    // Force desktop timeline lane so century buttons are visible in test.
    vi.mocked(useMediaQuery).mockImplementation(() => true);

    render(
      <ThemeProvider theme={theme}>
        <AppProvider towns={towns}>
          <SelectedYearProbe />
          <Timeline marks={marks} />
        </AppProvider>
      </ThemeProvider>
    );

    expect(screen.getByTestId("selected-year")).toHaveTextContent("800");
    fireEvent.click(screen.getByRole("button", { name: "1200 AD" }));

    await waitFor(() =>
      expect(screen.getByTestId("selected-year")).toHaveTextContent("1200")
    );
    vi.mocked(useMediaQuery).mockReset();
  });
});
