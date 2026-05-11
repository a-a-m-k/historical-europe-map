import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  getMapDeviceKey,
  useStableMapKey,
} from "@/hooks/map/activation/useStableMapKey";

describe("getMapDeviceKey", () => {
  it("returns 'mobile' when isMobile", () => {
    expect(getMapDeviceKey({ isMobile: true, isTablet: false })).toBe("mobile");
  });

  it("returns 'tablet' when isTablet", () => {
    expect(getMapDeviceKey({ isMobile: false, isTablet: true })).toBe("tablet");
  });

  it("returns 'desktop' when neither mobile nor tablet", () => {
    expect(getMapDeviceKey({ isMobile: false, isTablet: false })).toBe(
      "desktop"
    );
  });

  it("edge: isMobile true takes precedence when both isMobile and isTablet true", () => {
    expect(getMapDeviceKey({ isMobile: true, isTablet: true })).toBe("mobile");
  });
});

describe("useStableMapKey", () => {
  it("returns device key when not below min viewport", () => {
    const { result } = renderHook(() =>
      useStableMapKey({
        isMobile: true,
        isTablet: false,
        isBelowMinViewport: false,
      })
    );
    expect(result.current).toBe("mobile");
  });

  it("returns last key when below min viewport", () => {
    const { result, rerender } = renderHook(
      (viewport: {
        isMobile: boolean;
        isTablet: boolean;
        isBelowMinViewport: boolean;
      }) => useStableMapKey(viewport),
      {
        initialProps: {
          isMobile: false,
          isTablet: false,
          isBelowMinViewport: false,
        },
      }
    );
    expect(result.current).toBe("desktop");

    rerender({
      isMobile: false,
      isTablet: false,
      isBelowMinViewport: true,
    });
    expect(result.current).toBe("desktop");
  });

  it("updates key when viewport goes back above min", () => {
    const { result, rerender } = renderHook(
      (viewport: {
        isMobile: boolean;
        isTablet: boolean;
        isBelowMinViewport: boolean;
      }) => useStableMapKey(viewport),
      {
        initialProps: {
          isMobile: false,
          isTablet: true,
          isBelowMinViewport: false,
        },
      }
    );
    expect(result.current).toBe("tablet");

    rerender({
      isMobile: true,
      isTablet: false,
      isBelowMinViewport: false,
    });
    expect(result.current).toBe("mobile");
  });

  it("edge: when initially below min viewport, key is still a valid device string", () => {
    const { result } = renderHook(() =>
      useStableMapKey({
        isMobile: false,
        isTablet: false,
        isBelowMinViewport: true,
      })
    );
    expect(["mobile", "tablet", "desktop"]).toContain(result.current);
  });
});
