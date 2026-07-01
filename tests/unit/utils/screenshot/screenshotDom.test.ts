import { describe, expect, it, vi } from "vitest";

import {
  dispatchLegendScreenshotExpand,
  dispatchLegendScreenshotRestore,
  hideMapControls,
  onLegendScreenshotExpand,
  onLegendScreenshotRestore,
  restoreMapControls,
} from "@/utils/screenshot";

describe("screenshot DOM helpers", () => {
  it("dispatches legend screenshot events via the in-process event bus", () => {
    const expandListener = vi.fn();
    const restoreListener = vi.fn();
    const cleanupExpand = onLegendScreenshotExpand(expandListener);
    const cleanupRestore = onLegendScreenshotRestore(restoreListener);

    dispatchLegendScreenshotExpand();
    dispatchLegendScreenshotRestore();

    expect(expandListener).toHaveBeenCalledTimes(1);
    expect(restoreListener).toHaveBeenCalledTimes(1);

    cleanupExpand();
    cleanupRestore();
  });

  it("subscribes and unsubscribes expand/restore listeners", () => {
    const expandListener = vi.fn();
    const restoreListener = vi.fn();

    const cleanupExpand = onLegendScreenshotExpand(expandListener);
    const cleanupRestore = onLegendScreenshotRestore(restoreListener);

    dispatchLegendScreenshotExpand();
    dispatchLegendScreenshotRestore();
    expect(expandListener).toHaveBeenCalledTimes(1);
    expect(restoreListener).toHaveBeenCalledTimes(1);

    cleanupExpand();
    cleanupRestore();

    dispatchLegendScreenshotExpand();
    dispatchLegendScreenshotRestore();
    expect(expandListener).toHaveBeenCalledTimes(1);
    expect(restoreListener).toHaveBeenCalledTimes(1);
  });

  it("hides and restores map controls including screenshot button by default", () => {
    const mapContainer = document.createElement("div");
    mapContainer.innerHTML = `
      <div id="map-reset-view-button" style="display:flex"></div>
      <div id="map-style-toggle"></div>
      <div id="legend-collapse-button" style="display:block"></div>
      <div id="map-screenshot-button" style="display:inline-flex"></div>
      <div id="timeline"></div>
    `;

    const { controls, prevDisplay } = hideMapControls(mapContainer);
    expect(controls.length).toBeGreaterThan(0);
    controls.forEach(control => {
      expect((control as HTMLElement).style.display).toBe("none");
    });

    restoreMapControls(controls, prevDisplay);
    expect(
      (mapContainer.querySelector("#map-screenshot-button") as HTMLElement)
        .style.display
    ).toBe("inline-flex");
    expect(
      (mapContainer.querySelector("#map-reset-view-button") as HTMLElement)
        .style.display
    ).toBe("flex");
  });

  it("keeps screenshot button visible when requested", () => {
    const mapContainer = document.createElement("div");
    mapContainer.innerHTML = `
      <div id="map-screenshot-button" style="display:inline-flex"></div>
      <div id="map-reset-view-button" style="display:flex"></div>
    `;

    const { controls } = hideMapControls(mapContainer, {
      keepScreenshotButtonVisibleDuringCapture: true,
    });

    expect(
      (mapContainer.querySelector("#map-screenshot-button") as HTMLElement)
        .style.display
    ).toBe("inline-flex");
    expect(
      (mapContainer.querySelector("#map-reset-view-button") as HTMLElement)
        .style.display
    ).toBe("none");
    expect(Array.from(controls)).not.toContain(
      mapContainer.querySelector("#map-screenshot-button")
    );
  });
});
