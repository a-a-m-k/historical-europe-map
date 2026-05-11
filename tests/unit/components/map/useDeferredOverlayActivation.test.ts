import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useDeferredOverlayActivation } from "@/hooks/map/activation/useDeferredOverlayActivation";

describe("useDeferredOverlayActivation", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("stays inactive before map is ready", () => {
    const { result } = renderHook(() =>
      useDeferredOverlayActivation(false, { startActivated: false })
    );
    expect(result.current).toBe(false);
  });

  it("activates on first interaction when map is ready", async () => {
    const { result } = renderHook(() =>
      useDeferredOverlayActivation(true, { startActivated: false })
    );
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("pointerdown"));
    });

    await waitFor(() => expect(result.current).toBe(true));
  });

  it("activates via timeout fallback when requestIdleCallback is unavailable", async () => {
    vi.useFakeTimers();
    const originalRequestIdleCallback = window.requestIdleCallback;
    Object.defineProperty(window, "requestIdleCallback", {
      value: undefined,
      configurable: true,
    });

    const { result } = renderHook(() =>
      useDeferredOverlayActivation(true, { startActivated: false })
    );
    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1_500);
    });

    expect(result.current).toBe(true);

    Object.defineProperty(window, "requestIdleCallback", {
      value: originalRequestIdleCallback,
      configurable: true,
    });
  });

  it("removes interaction listeners on unmount", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() =>
      useDeferredOverlayActivation(true, { startActivated: false })
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
      expect.any(Function),
      { once: true }
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function),
      { once: true }
    );
  });
});
