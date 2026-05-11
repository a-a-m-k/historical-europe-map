import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";

import ScreenshotButton from "@/components/controls/ScreenshotButton/ScreenshotButton";
import theme from "@/theme/theme";

const captureScreenshot = vi.fn();
const isCapturingState = { value: false };

vi.mock("@/hooks/ui", () => ({
  useScreenshot: () => ({
    captureScreenshot,
    isCapturing: isCapturingState.value,
  }),
}));

describe("ScreenshotButton", () => {
  beforeEach(() => {
    captureScreenshot.mockReset();
    isCapturingState.value = false;
  });

  it("captures on click when idle", () => {
    render(
      <ThemeProvider theme={theme}>
        <ScreenshotButton />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId("screenshot-button"));
    expect(captureScreenshot).toHaveBeenCalledTimes(1);
  });

  it("captures on Ctrl+S outside input fields", () => {
    render(
      <ThemeProvider theme={theme}>
        <ScreenshotButton />
      </ThemeProvider>
    );

    fireEvent.keyDown(window, {
      key: "s",
      ctrlKey: true,
      target: document.body,
    });

    expect(captureScreenshot).toHaveBeenCalledTimes(1);
  });

  it("does not capture on Ctrl+S while typing in input", () => {
    render(
      <ThemeProvider theme={theme}>
        <ScreenshotButton />
      </ThemeProvider>
    );
    const input = document.createElement("input");
    document.body.appendChild(input);

    fireEvent.keyDown(input, {
      key: "s",
      ctrlKey: true,
    });

    expect(captureScreenshot).not.toHaveBeenCalled();
  });
});
