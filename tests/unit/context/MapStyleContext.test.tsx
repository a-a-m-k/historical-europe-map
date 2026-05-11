import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { MapStyleProvider, useMapStyleMode } from "@/context/MapStyleContext";

const Probe: React.FC = () => {
  const { mode, setMode, toggleMode } = useMapStyleMode();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <button type="button" onClick={() => setMode("dark")}>
        set-dark
      </button>
      <button type="button" onClick={toggleMode}>
        toggle
      </button>
    </div>
  );
};

describe("MapStyleContext", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to light when storage is empty", () => {
    render(
      <MapStyleProvider>
        <Probe />
      </MapStyleProvider>
    );

    expect(screen.getByTestId("mode")).toHaveTextContent("light");
  });

  it("hydrates dark mode from localStorage", () => {
    window.localStorage.setItem("historical-europe-map-basemap-style", "dark");

    render(
      <MapStyleProvider>
        <Probe />
      </MapStyleProvider>
    );

    expect(screen.getByTestId("mode")).toHaveTextContent("dark");
  });

  it("setMode persists value and toggleMode flips it", () => {
    render(
      <MapStyleProvider>
        <Probe />
      </MapStyleProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "set-dark" }));
    expect(screen.getByTestId("mode")).toHaveTextContent("dark");
    expect(window.localStorage.getItem("historical-europe-map-basemap-style")).toBe(
      "dark"
    );

    fireEvent.click(screen.getByRole("button", { name: "toggle" }));
    expect(screen.getByTestId("mode")).toHaveTextContent("light");
    expect(window.localStorage.getItem("historical-europe-map-basemap-style")).toBe(
      "light"
    );
  });

  it("throws when hook is used outside provider", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    expect(() => render(<Probe />)).toThrow(
      "useMapStyleMode must be used within MapStyleProvider"
    );
    consoleErrorSpy.mockRestore();
  });
});
