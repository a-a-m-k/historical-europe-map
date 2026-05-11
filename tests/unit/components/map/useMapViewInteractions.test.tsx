import React, { useRef } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

import { useMapViewInteractions } from "@/hooks/map/interactions/useMapViewInteractions";

const useMapKeyboardShortcutsMock = vi.hoisted(() => vi.fn());
const useMapKeyboardPanningMock = vi.hoisted(() => vi.fn());
const useNavigationControlAccessibilityMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/map/interactions/useMapKeyboardShortcuts", () => ({
  useMapKeyboardShortcuts: useMapKeyboardShortcutsMock,
}));
vi.mock("@/hooks/map/interactions/useMapKeyboardPanning", () => ({
  useMapKeyboardPanning: useMapKeyboardPanningMock,
}));
vi.mock("@/hooks/map/interactions/useNavigationControlAccessibility", () => ({
  useNavigationControlAccessibility: useNavigationControlAccessibilityMock,
}));

function TestHarness() {
  const mapRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useMapViewInteractions({
    mapRef,
    containerRef,
    enableZoomControls: true,
    showZoomButtons: false,
    prefersReducedMotion: true,
    toggleBasemapMode: vi.fn(),
  });

  return <div ref={containerRef}>map</div>;
}

describe("useMapViewInteractions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("wires keyboard, panning and accessibility hooks with expected options", () => {
    render(<TestHarness />);

    expect(useMapKeyboardShortcutsMock).toHaveBeenCalledTimes(1);
    expect(useMapKeyboardShortcutsMock.mock.calls[0][1]).toBe(true);
    expect(useMapKeyboardShortcutsMock.mock.calls[0][2]).toBe(0);

    expect(useMapKeyboardPanningMock).toHaveBeenCalledTimes(1);
    expect(useMapKeyboardPanningMock.mock.calls[0][2]).toBe(true);

    expect(useNavigationControlAccessibilityMock).toHaveBeenCalledTimes(1);
    expect(useNavigationControlAccessibilityMock.mock.calls[0][0]).toBe(false);
  });
});
