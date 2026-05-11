import { renderHook, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";

import {
  MAP_ACTIVATION_MARK,
  MAP_ACTIVATION_TO_IDLE_MEASURE,
  MAP_FIRST_IDLE_MARK,
  markPerformance,
  measurePerformance,
} from "@/hooks/map/activation/useMapActivationGate";

vi.mock("@/utils/observability", () => ({
  trackEvent: vi.fn(),
}));

describe("useMapActivationGate performance helpers", () => {
  it("marks and measures map activation duration", () => {
    markPerformance(MAP_ACTIVATION_MARK);
    markPerformance(MAP_FIRST_IDLE_MARK);

    const duration = measurePerformance(
      MAP_ACTIVATION_TO_IDLE_MEASURE,
      MAP_ACTIVATION_MARK,
      MAP_FIRST_IDLE_MARK
    );

    expect(duration).not.toBeNull();
    expect(typeof duration).toBe("number");
  });

  it("returns null for missing marks", () => {
    const duration = measurePerformance(
      "missing-measure",
      "missing-start-mark",
      "missing-end-mark"
    );

    expect(duration).toBeNull();
  });
});

describe("useMapActivationGate behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("activates on first interaction event", async () => {
    const { trackEvent } = await import("@/utils/observability");

    const { useMapActivationGate } =
      await import("@/hooks/map/activation/useMapActivationGate");
    const { result } = renderHook(() =>
      useMapActivationGate({ startActivated: false })
    );
    expect(result.current.isMapActivated).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("pointerdown"));
    });

    await waitFor(() => expect(result.current.isMapActivated).toBe(true));
    expect(trackEvent).toHaveBeenCalledWith({
      name: "map_activation_triggered",
      data: {
        activation_mode: "deferred",
        source: "interaction",
      },
    });
  });

  it("activates immediately when IntersectionObserver is unavailable", async () => {
    const originalIntersectionObserver = globalThis.IntersectionObserver;
    Object.defineProperty(globalThis, "IntersectionObserver", {
      value: undefined,
      configurable: true,
    });
    const { trackEvent } = await import("@/utils/observability");
    const { useMapActivationGate } =
      await import("@/hooks/map/activation/useMapActivationGate");

    const { result } = renderHook(() =>
      useMapActivationGate({ startActivated: false })
    );

    await waitFor(() => expect(result.current.isMapActivated).toBe(true));
    expect(trackEvent).toHaveBeenCalledWith({
      name: "map_activation_triggered",
      data: {
        activation_mode: "deferred",
        source: "observer-unavailable",
      },
    });

    Object.defineProperty(globalThis, "IntersectionObserver", {
      value: originalIntersectionObserver,
      configurable: true,
    });
  });

  it("cleans up interaction listeners on unmount", async () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const { useMapActivationGate } =
      await import("@/hooks/map/activation/useMapActivationGate");

    const { unmount } = renderHook(() =>
      useMapActivationGate({ startActivated: false })
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "pointerdown",
      expect.any(Function),
      { once: true }
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function),
      { once: true }
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "pointerdown",
      expect.any(Function)
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
  });

  it("activates from deferred idle when map gate becomes visible", async () => {
    const { trackEvent } = await import("@/utils/observability");
    const { useMapActivationGate } =
      await import("@/hooks/map/activation/useMapActivationGate");
    const gateElement = document.createElement("div");
    const requestIdleCallbackMock = vi.fn((cb: IdleRequestCallback) => {
      cb({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline);
      return 1;
    });
    Object.defineProperty(window, "requestIdleCallback", {
      value: requestIdleCallbackMock,
      configurable: true,
    });
    const requestIdleCallbackSpy = vi
      .spyOn(window, "requestIdleCallback")
      .mockImplementation(cb => {
        cb({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline);
        return 1;
      });

    const intersectionObserverMock = vi.fn().mockImplementation(
      (
        callback: (
          entries: Array<{
            isIntersecting: boolean;
            intersectionRatio: number;
          }>
        ) => void
      ) => ({
        observe: vi.fn(() => {
          callback([{ isIntersecting: true, intersectionRatio: 1 }]);
        }),
        disconnect: vi.fn(),
      })
    );
    Object.defineProperty(globalThis, "IntersectionObserver", {
      value: intersectionObserverMock,
      configurable: true,
    });

    const { result } = renderHook(() => {
      const hookResult = useMapActivationGate({ startActivated: false });
      (
        hookResult.mapMountGateRef as { current: HTMLDivElement | null }
      ).current = gateElement;
      return hookResult;
    });
    await waitFor(() => expect(result.current.isMapActivated).toBe(true));
    expect(requestIdleCallbackSpy).toHaveBeenCalled();
    expect(trackEvent).toHaveBeenCalledWith({
      name: "map_activation_triggered",
      data: {
        activation_mode: "deferred",
        source: "deferred-idle",
      },
    });
  });
});
