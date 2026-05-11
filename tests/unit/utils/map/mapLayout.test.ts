import { describe, it, expect, vi } from "vitest";
import {
  getInitialMapProps,
  formatCenturyLabel,
  TIMELINE_MARKS,
} from "@/utils/map/layout/mapLayout";
import { DEFAULT_CENTER, DEFAULT_ZOOM, MAX_ZOOM_LEVEL } from "@/constants";

vi.mock("@/utils/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("formatCenturyLabel", () => {
  it("returns century label for known year", () => {
    expect(formatCenturyLabel(800)).toBe("8th ct.");
    expect(formatCenturyLabel(1000)).toBe("10th ct.");
    expect(formatCenturyLabel(1200)).toBe("12th ct.");
  });

  it("returns year string when century not in map", () => {
    const result = formatCenturyLabel(9999);
    expect(result).toBe("9999");
  });

  it("edge: negative year returns string", () => {
    expect(formatCenturyLabel(-500)).toBe("-500");
  });

  it("edge: zero year returns string", () => {
    expect(formatCenturyLabel(0)).toBe("0");
  });
});

describe("TIMELINE_MARKS", () => {
  it("has correct first and last century labels from YEARS", () => {
    expect(TIMELINE_MARKS.length).toBeGreaterThan(0);
    expect(TIMELINE_MARKS[0]).toEqual({ value: 800, label: "8th ct." });
    expect(TIMELINE_MARKS[TIMELINE_MARKS.length - 1].value).toBe(1750);
    expect(TIMELINE_MARKS[TIMELINE_MARKS.length - 1].label).toMatch(
      /\d+th ct\./
    );
  });
});

describe("getInitialMapProps", () => {
  const validState = {
    center: { latitude: 50, longitude: 10 },
    fitZoom: 5,
  };

  it("returns default when useDefaultView is true", () => {
    const result = getInitialMapProps(true, validState);
    expect(result.initialPosition).toEqual(DEFAULT_CENTER);
    expect(result.initialZoom).toBe(DEFAULT_ZOOM);
  });

  it("returns default when center is undefined", () => {
    const result = getInitialMapProps(false, {
      center: undefined,
      fitZoom: 5,
    });
    expect(result.initialPosition).toEqual(DEFAULT_CENTER);
    expect(result.initialZoom).toBe(DEFAULT_ZOOM);
  });

  it("returns initial state when valid center and zoom", () => {
    const result = getInitialMapProps(false, validState);
    expect(result.initialPosition).toEqual({ latitude: 50, longitude: 10 });
    expect(result.initialZoom).toBe(5);
  });

  it("returns default for invalid center (NaN)", () => {
    const result = getInitialMapProps(false, {
      center: { latitude: NaN, longitude: 10 },
      fitZoom: 5,
    });
    expect(result.initialPosition).toEqual(DEFAULT_CENTER);
    expect(result.initialZoom).toBe(DEFAULT_ZOOM);
  });

  it("returns default for invalid zoom (negative)", () => {
    const result = getInitialMapProps(false, {
      center: validState.center,
      fitZoom: -1,
    });
    expect(result.initialPosition).toEqual(DEFAULT_CENTER);
    expect(result.initialZoom).toBe(DEFAULT_ZOOM);
  });

  it("edge: zoom 0 is valid (boundary, fitZoom >= 0)", () => {
    const result = getInitialMapProps(false, {
      center: validState.center,
      fitZoom: 0,
    });
    expect(result.initialPosition).toEqual(validState.center);
    expect(result.initialZoom).toBe(0);
  });

  it("edge: zoom at MAX_ZOOM_LEVEL is valid", () => {
    const result = getInitialMapProps(false, {
      center: validState.center,
      fitZoom: MAX_ZOOM_LEVEL,
    });
    expect(result.initialZoom).toBe(MAX_ZOOM_LEVEL);
    expect(result.initialPosition).toEqual(validState.center);
  });

  it("edge: center at south pole (-90) is valid", () => {
    const result = getInitialMapProps(false, {
      center: { latitude: -90, longitude: 0 },
      fitZoom: 3,
    });
    expect(result.initialPosition).toEqual({ latitude: -90, longitude: 0 });
    expect(result.initialZoom).toBe(3);
  });

  it("edge: center at north pole (90) is valid", () => {
    const result = getInitialMapProps(false, {
      center: { latitude: 90, longitude: 0 },
      fitZoom: 3,
    });
    expect(result.initialPosition).toEqual({ latitude: 90, longitude: 0 });
  });
});
