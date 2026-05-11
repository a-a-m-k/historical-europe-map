import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import MapPage from "@/pages/MapPage";

vi.mock("@/components/layouts", () => ({
  MapScreen: () => <div data-testid="map-screen">Map screen</div>,
}));

describe("MapPage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders map screen when Stadia API key is available", () => {
    vi.stubEnv("VITE_STADIA_API_KEY", "test-api-key");

    render(<MapPage />);

    expect(screen.getByTestId("map-screen")).toBeInTheDocument();
    expect(
      screen.queryByText("Map configuration required")
    ).not.toBeInTheDocument();
  });

  it("renders missing-key message when Stadia API key is absent", () => {
    vi.stubEnv("VITE_STADIA_API_KEY", "");

    render(<MapPage />);

    expect(screen.getByText("Map configuration required")).toBeInTheDocument();
    expect(
      screen.getByText(/VITE_STADIA_API_KEY is not set/i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId("map-screen")).not.toBeInTheDocument();
  });
});
