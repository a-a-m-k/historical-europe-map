import { describe, expect, it, vi } from "vitest";

import {
  dispatchMapCameraResetState,
  dispatchMapResetCamera,
  dispatchMapScreenshotCaptureState,
  dispatchMapScreenshotLegendExpand,
  dispatchMapScreenshotLegendRestore,
  onMapCameraResetState,
  onMapResetCamera,
  onMapScreenshotCaptureState,
  onMapScreenshotLegendExpand,
  onMapScreenshotLegendRestore,
} from "@/utils/events/mapEvents";

describe("map event helpers", () => {
  it("subscribes and dispatches reset camera event", () => {
    const listener = vi.fn();
    const cleanup = onMapResetCamera(listener);

    dispatchMapResetCamera();
    expect(listener).toHaveBeenCalledTimes(1);

    cleanup();
  });

  it("subscribes and dispatches reset state detail", () => {
    const listener = vi.fn();
    const cleanup = onMapCameraResetState(listener);

    dispatchMapCameraResetState({ isAtResetCamera: true });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ isAtResetCamera: true });

    cleanup();
  });

  it("subscribes and dispatches screenshot capture detail", () => {
    const listener = vi.fn();
    const cleanup = onMapScreenshotCaptureState(listener);

    dispatchMapScreenshotCaptureState({ isCapturing: true });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ isCapturing: true });

    cleanup();
  });

  it("subscribes and dispatches screenshot legend expand/restore", () => {
    const expandListener = vi.fn();
    const restoreListener = vi.fn();
    const cleanupExpand = onMapScreenshotLegendExpand(expandListener);
    const cleanupRestore = onMapScreenshotLegendRestore(restoreListener);

    dispatchMapScreenshotLegendExpand();
    dispatchMapScreenshotLegendRestore();
    expect(expandListener).toHaveBeenCalledTimes(1);
    expect(restoreListener).toHaveBeenCalledTimes(1);

    cleanupExpand();
    cleanupRestore();
  });
});
