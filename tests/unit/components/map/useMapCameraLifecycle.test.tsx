import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RESIZE_RECENTER_DELAY_MS } from "@/utils/map/camera/cameraReset";
import { useMapCameraLifecycle } from "@/hooks/map/camera/useMapCameraLifecycle";

const dispatchMapCameraResetStateMock = vi.hoisted(() => vi.fn());
const onMapResetCameraMock = vi.hoisted(() => vi.fn());

vi.mock("@/utils/events/mapEvents", () => ({
  dispatchMapCameraResetState: dispatchMapCameraResetStateMock,
  onMapResetCamera: onMapResetCameraMock,
}));

const baseArgs = {
  safeProps: { longitude: 10, latitude: 20, zoom: 4 },
  effectiveMinZoom: 3,
  requestCameraFitTo: vi.fn(),
  viewState: { longitude: 10, latitude: 20, zoom: 4 },
  mapReady: true,
  isResizing: false,
  containerSize: { width: 800, height: 600 },
} as const;

describe("useMapCameraLifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    onMapResetCameraMock.mockReturnValue(() => undefined);
  });

  it("runs one initial deferred camera fit after map becomes ready", () => {
    const requestCameraFitTo = vi.fn();
    renderHook(() =>
      useMapCameraLifecycle({ ...baseArgs, requestCameraFitTo, mapReady: true })
    );

    expect(requestCameraFitTo).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(RESIZE_RECENTER_DELAY_MS);
    });
    expect(requestCameraFitTo).toHaveBeenCalledTimes(1);
    expect(requestCameraFitTo).toHaveBeenCalledWith({
      longitude: 10,
      latitude: 20,
      zoom: 4,
    });
  });

  it("triggers deferred refit when resize lifecycle ends", () => {
    const requestCameraFitTo = vi.fn();
    const { rerender } = renderHook(
      ({ isResizing }) =>
        useMapCameraLifecycle({
          ...baseArgs,
          requestCameraFitTo,
          isResizing,
          containerSize: null,
        }),
      { initialProps: { isResizing: true } }
    );

    act(() => {
      vi.advanceTimersByTime(RESIZE_RECENTER_DELAY_MS);
    });
    expect(requestCameraFitTo).not.toHaveBeenCalled();

    rerender({ isResizing: false });
    act(() => {
      vi.advanceTimersByTime(RESIZE_RECENTER_DELAY_MS);
    });
    expect(requestCameraFitTo).toHaveBeenCalledTimes(1);
  });

  it("triggers deferred refit when measured container size changes", () => {
    const requestCameraFitTo = vi.fn();
    const { rerender } = renderHook(
      ({ containerSize }) =>
        useMapCameraLifecycle({
          ...baseArgs,
          requestCameraFitTo,
          containerSize,
        }),
      { initialProps: { containerSize: { width: 800, height: 600 } } }
    );

    act(() => {
      vi.advanceTimersByTime(RESIZE_RECENTER_DELAY_MS);
    });
    expect(requestCameraFitTo).toHaveBeenCalledTimes(1);

    rerender({ containerSize: { width: 900, height: 600 } });
    act(() => {
      vi.advanceTimersByTime(RESIZE_RECENTER_DELAY_MS);
    });
    expect(requestCameraFitTo).toHaveBeenCalledTimes(2);
  });
});
