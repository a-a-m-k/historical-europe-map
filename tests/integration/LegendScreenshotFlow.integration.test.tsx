import React from "react";
import { describe, expect, it } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";

import { LegendContent } from "@/ui/legend/LegendContent";
import {
  dispatchLegendScreenshotExpand,
  dispatchLegendScreenshotRestore,
} from "@/utils/screenshot";
import theme from "@/theme/theme";
import type { LayerItem } from "@/common/types";

const layers: LayerItem[] = [
  { layer: "0-1k", color: "#abc" },
  { layer: "1k-5k", color: "#def" },
];

describe("Legend screenshot flow integration", () => {
  it("restores collapsed state after screenshot expand/restore events", async () => {
    render(
      <ThemeProvider theme={theme}>
        <LegendContent label="Population" layers={layers} selectedYear={1200} />
      </ThemeProvider>
    );

    const collapseButton = screen.getByRole("button", {
      name: /collapse legend/i,
    });
    fireEvent.click(collapseButton);
    await waitFor(() =>
      expect(collapseButton).toHaveAttribute("aria-expanded", "false")
    );

    await act(async () => {
      dispatchLegendScreenshotExpand();
    });
    await waitFor(() =>
      expect(collapseButton).toHaveAttribute("aria-expanded", "true")
    );

    await act(async () => {
      dispatchLegendScreenshotRestore();
    });
    await waitFor(() =>
      expect(collapseButton).toHaveAttribute("aria-expanded", "false")
    );
  });
});
