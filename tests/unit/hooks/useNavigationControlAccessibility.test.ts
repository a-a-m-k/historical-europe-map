import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RefObject } from "react";

import { useNavigationControlAccessibility } from "@/hooks/map/interactions/useNavigationControlAccessibility";
import { strings } from "@/locales";

const loggerErrorMock = vi.hoisted(() => vi.fn());

vi.mock("@/utils/logger", () => ({
  logger: {
    error: loggerErrorMock,
  },
}));

describe("useNavigationControlAccessibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  it("applies accessibility attributes to zoom controls", () => {
    vi.useFakeTimers();
    const container = document.createElement("div");
    container.setAttribute("role", "application");
    container.innerHTML = `
      <div class="maplibregl-ctrl-group">
        <button class="maplibregl-ctrl-zoom-in" title="Zoom in"></button>
        <button class="maplibregl-ctrl-zoom-out" title="Zoom out"></button>
      </div>
    `;
    document.body.appendChild(container);

    renderHook(() =>
      useNavigationControlAccessibility(true, {
        current: container,
      } as RefObject<HTMLElement>)
    );

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    const zoomIn = container.querySelector(".maplibregl-ctrl-zoom-in")!;
    const zoomOut = container.querySelector(".maplibregl-ctrl-zoom-out")!;

    expect(zoomIn.getAttribute("aria-label")).toBe(strings.map.zoomInTooltip);
    expect(zoomIn.getAttribute("data-tooltip")).toBe(strings.map.zoomInTooltip);
    expect(zoomIn.getAttribute("title")).toBeNull();

    expect(zoomOut.getAttribute("aria-label")).toBe(strings.map.zoomOutTooltip);
    expect(zoomOut.getAttribute("data-tooltip")).toBe(
      strings.map.zoomOutTooltip
    );
    expect(zoomOut.getAttribute("title")).toBeNull();
  });

  it("does nothing when disabled", () => {
    vi.useFakeTimers();
    const container = document.createElement("div");
    container.setAttribute("role", "application");
    container.innerHTML = `
      <div class="maplibregl-ctrl-group">
        <button class="maplibregl-ctrl-zoom-in" title="Zoom in"></button>
      </div>
    `;
    document.body.appendChild(container);

    renderHook(() =>
      useNavigationControlAccessibility(false, {
        current: container,
      } as RefObject<HTMLElement>)
    );

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    const zoomIn = container.querySelector(".maplibregl-ctrl-zoom-in")!;
    expect(zoomIn.getAttribute("title")).toBe("Zoom in");
    expect(zoomIn.hasAttribute("aria-label")).toBe(false);
  });
});
