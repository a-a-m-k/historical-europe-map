import React from "react";
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ThemeProvider } from "@mui/material/styles";
import { MapResetViewButton } from "@/components/controls/MapResetViewButton/MapResetViewButton";
import {
  dispatchMapCameraResetState,
  dispatchMapResetCamera,
} from "@/utils/events/mapEvents";
import { lightTheme } from "@/theme/theme";

vi.mock("@/utils/events/mapEvents", async importOriginal => {
  const actual = await importOriginal<typeof import("@/utils/events/mapEvents")>();
  return {
    ...actual,
    dispatchMapResetCamera: vi.fn(actual.dispatchMapResetCamera),
  };
});

describe("MapResetViewButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dispatches reset event when enabled", () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <MapResetViewButton />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId("map-reset-view-button"));

    expect(dispatchMapResetCamera).toHaveBeenCalledTimes(1);
  });

  it("disables when map is already centered", async () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <MapResetViewButton />
      </ThemeProvider>
    );

    act(() => {
      dispatchMapCameraResetState({ isAtResetCamera: true });
    });

    const button = screen.getByTestId("map-reset-view-button");
    await waitFor(() => {
      expect(button).toBeDisabled();
    });

    fireEvent.click(button);

    expect(dispatchMapResetCamera).not.toHaveBeenCalled();
  });
});
