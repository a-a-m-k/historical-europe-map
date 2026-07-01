import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { useYearDataController } from "@/context/useYearDataController";
import {
  createMockYearDataService,
  renderHookWithYearDataService,
} from "../../helpers/yearDataServiceTestUtils";
import { computeTownsFingerprint } from "@/utils/townsFingerprint";
import { mockTownsMinimal } from "../../helpers/testUtils";

const {
  mockCalculateBoundsCenter,
  mockAnnounce,
  mockReportAppError,
  mockGetAppErrorMessage,
  mockTrackEvent,
  mockTrackTiming,
} = vi.hoisted(() => ({
  mockCalculateBoundsCenter: vi.fn(() => ({
    latitude: 48.8566,
    longitude: 2.3522,
  })),
  mockAnnounce: vi.fn(),
  mockReportAppError: vi.fn(),
  mockGetAppErrorMessage: vi.fn(
    (error: unknown, context?: { category?: string }) => {
      const category = context?.category;
      if (category === "no-towns-data") return "No towns data available.";
      if (error instanceof Error) return error.message;
      return "Unexpected error";
    }
  ),
  mockTrackEvent: vi.fn(),
  mockTrackTiming: vi.fn(),
}));

vi.mock("@/utils/geoBounds", () => ({
  calculateBoundsCenter: mockCalculateBoundsCenter,
}));

vi.mock("@/utils/accessibility", () => ({
  announce: mockAnnounce,
}));

vi.mock("@/utils/errorPolicy", () => ({
  reportAppError: mockReportAppError,
  getAppErrorMessage: mockGetAppErrorMessage,
  reportAndAnnounceAppError: (error: unknown, context: object) => {
    mockReportAppError(error, context);
    const message = mockGetAppErrorMessage(
      error,
      context as { category?: string }
    );
    mockAnnounce(message, "assertive");
    return message;
  },
}));

vi.mock("@/utils/observability", () => ({
  trackEvent: mockTrackEvent,
  trackTiming: mockTrackTiming,
}));

describe("useYearDataController", () => {
  const emptyTowns: typeof mockTownsMinimal = [];
  const townsVersion = computeTownsFingerprint(mockTownsMinimal);
  let mockGetFilteredTowns: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFilteredTowns = vi.fn((towns, year: number) =>
      towns.filter(
        (t: { populationByYear?: Record<string, number> }) =>
          t.populationByYear?.[String(year)] != null
      )
    );
    mockCalculateBoundsCenter.mockImplementation(() => ({
      latitude: 48.8566,
      longitude: 2.3522,
    }));
  });

  const renderController = (
    ...args: Parameters<typeof useYearDataController>
  ) =>
    renderHookWithYearDataService(
      () => useYearDataController(...args),
      createMockYearDataService({ getFilteredTowns: mockGetFilteredTowns })
    );

  it("loads filtered towns after bounds initialization", async () => {
    const { result } = renderController({
      towns: mockTownsMinimal,
      townsVersion,
      selectedYear: 1000,
    });

    await waitFor(() => {
      expect(result.current.filteredTowns).toHaveLength(2);
    });
    expect(result.current.yearDataError).toBeNull();
  });

  it("sets error when calculateBoundsCenter fails during init", async () => {
    mockCalculateBoundsCenter.mockImplementation(() => {
      throw new Error("bounds");
    });

    const { result } = renderController({
      towns: mockTownsMinimal,
      townsVersion,
      selectedYear: 1000,
    });

    await waitFor(() => {
      expect(result.current.yearDataError).toBeTruthy();
    });
    expect(result.current.filteredTowns).toEqual([]);
    expect(mockAnnounce).toHaveBeenCalledWith(expect.any(String), "assertive");
  });

  it("sets error and announces when getFilteredTowns throws", async () => {
    mockGetFilteredTowns.mockImplementation(() => {
      throw new Error("service failure");
    });

    const { result } = renderController({
      towns: mockTownsMinimal,
      townsVersion,
      selectedYear: 1000,
    });

    await waitFor(() => {
      expect(result.current.yearDataError).toBeTruthy();
    });
    expect(mockAnnounce).toHaveBeenCalledWith(expect.any(String), "assertive");
  });

  it("does not report error while towns are still loading", async () => {
    const { result } = renderController({
      towns: emptyTowns,
      townsVersion: null,
      selectedYear: 800,
      isTownsLoading: true,
    });

    await waitFor(() => {
      expect(result.current.yearDataError).toBeNull();
    });
    expect(mockAnnounce).not.toHaveBeenCalled();
    expect(mockReportAppError).not.toHaveBeenCalled();
  });

  it("reports error once loading finishes with empty towns", async () => {
    const { result, rerender } = renderHookWithYearDataService(
      ({ isTownsLoading }: { isTownsLoading: boolean }) =>
        useYearDataController({
          towns: emptyTowns,
          townsVersion: null,
          selectedYear: 800,
          isTownsLoading,
        }),
      createMockYearDataService({ getFilteredTowns: mockGetFilteredTowns }),
      { initialProps: { isTownsLoading: true } }
    );

    await waitFor(() => {
      expect(result.current.yearDataError).toBeNull();
    });
    expect(mockAnnounce).not.toHaveBeenCalled();

    rerender({ isTownsLoading: false });

    await waitFor(() => {
      expect(result.current.yearDataError).toBe("No towns data available.");
    });
    expect(mockAnnounce).toHaveBeenCalledWith(
      "No towns data available.",
      "assertive"
    );
  });

  it("retry with empty towns sets a clear error and is not retryable", async () => {
    const { result } = renderController({
      towns: emptyTowns,
      townsVersion: null,
      selectedYear: 800,
    });

    await waitFor(() => {
      expect(result.current.yearDataError).toBeTruthy();
    });

    expect(result.current.isYearDataRetryable).toBe(false);

    act(() => {
      result.current.retryYearData();
    });

    expect(result.current.yearDataError).toBe("No towns data available.");
    expect(mockAnnounce).toHaveBeenCalledWith(
      "No towns data available.",
      "assertive"
    );
  });

  it("updates filtered towns when selectedYear changes", async () => {
    const { result, rerender } = renderHookWithYearDataService(
      ({ year }: { year: number }) =>
        useYearDataController({
          towns: mockTownsMinimal,
          townsVersion,
          selectedYear: year,
        }),
      createMockYearDataService({ getFilteredTowns: mockGetFilteredTowns }),
      { initialProps: { year: 800 } }
    );

    await waitFor(() => {
      expect(result.current.filteredTowns).toHaveLength(1);
    });
    expect(result.current.filteredTowns[0]?.name).toBe("Paris");

    rerender({ year: 1000 });

    await waitFor(() => {
      expect(result.current.filteredTowns).toHaveLength(2);
    });
  });

  it("retry re-attempts filtering, clears cache, and surfaces the same error", async () => {
    const clearCache = vi.fn();
    mockGetFilteredTowns.mockImplementation(() => {
      throw new Error("always fail");
    });

    const { result } = renderHookWithYearDataService(
      () =>
        useYearDataController({
          towns: mockTownsMinimal,
          townsVersion,
          selectedYear: 1000,
        }),
      createMockYearDataService({
        getFilteredTowns: mockGetFilteredTowns,
        clearCache,
      })
    );

    await waitFor(() => {
      expect(result.current.yearDataError).toBe("always fail");
    });

    expect(result.current.isYearDataRetryable).toBe(true);

    act(() => {
      result.current.retryYearData();
    });

    expect(result.current.yearDataError).toBe("always fail");
    expect(mockGetFilteredTowns).toHaveBeenCalledTimes(2);
    expect(clearCache).toHaveBeenCalledTimes(1);
  });
});
