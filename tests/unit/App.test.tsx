import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import App from "@/App";

vi.mock("@/pages/MapPage", () => ({
  default: () => <div data-testid="map-page">Map page</div>,
}));

vi.mock("@/components/dev", () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

vi.mock("@/context/MapStyleContext", () => ({
  MapStyleProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-style-provider">{children}</div>
  ),
}));

vi.mock("@/theme/AppThemeProvider", () => ({
  AppThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

describe("App", () => {
  it("mounts providers and renders main map page", () => {
    render(<App />);

    expect(screen.getByTestId("map-style-provider")).toBeInTheDocument();
    expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
    expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
    expect(screen.getByTestId("map-page")).toBeInTheDocument();
  });
});
