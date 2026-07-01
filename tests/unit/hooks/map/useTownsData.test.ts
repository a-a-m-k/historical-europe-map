import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTownsData } from "@/hooks/map/data/useTownsData";

const mockAnnounce = vi.hoisted(() => vi.fn());
const mockGetAppErrorMessage = vi.hoisted(() => vi.fn());
const mockReportAppError = vi.hoisted(() => vi.fn());
const mockRetryWithBackoff = vi.hoisted(() => vi.fn());
const mockTrackEvent = vi.hoisted(() => vi.fn());
const mockTrackTiming = vi.hoisted(() => vi.fn());
const mockValidateTownsData = vi.hoisted(() => vi.fn());

vi.mock("@/utils/retry", () => ({
  retryWithBackoff: mockRetryWithBackoff,
}));

vi.mock("@/utils/errorPolicy", () => ({
  getAppErrorMessage: mockGetAppErrorMessage,
  reportAppError: mockReportAppError,
  reportAndAnnounceAppError: (error: unknown, context: object) => {
    mockReportAppError(error, context);
    const message = mockGetAppErrorMessage(error, context);
    mockAnnounce(message, "assertive");
    return message;
  },
}));

vi.mock("@/utils/observability", () => ({
  trackEvent: mockTrackEvent,
  trackTiming: mockTrackTiming,
}));

vi.mock("@/utils/validateTowns", () => ({
  validateTownsData: mockValidateTownsData,
}));

vi.mock("@/utils/townsFingerprint", () => ({
  computeTownsFingerprint: vi.fn((towns: { name: string }[]) =>
    towns.length > 0 ? "test-version" : "empty"
  ),
}));

vi.mock("@/assets/history-data/towns.json", () => ({
  default: { schemaVersion: 1, towns: [{ name: "Paris" }] },
}));

describe("useTownsData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAppErrorMessage.mockReturnValue("Failed to load towns");
    mockRetryWithBackoff.mockImplementation(
      async (fn: () => Promise<unknown>) => fn()
    );
  });

  it("loads and validates towns data successfully", async () => {
    const towns = [
      {
        name: "Paris",
        latitude: 48.8566,
        longitude: 2.3522,
        populationByYear: { "800": 10000 },
      },
    ];
    mockValidateTownsData.mockReturnValue(towns);

    const { result } = renderHook(() => useTownsData());

    await waitFor(() => expect(result.current.isTownsLoading).toBe(false));
    expect(result.current.townsLoadError).toBeNull();
    expect(result.current.towns).toEqual(towns);
    expect(result.current.townsVersion).toBe("test-version");
    expect(mockValidateTownsData).toHaveBeenCalledWith({
      schemaVersion: 1,
      towns: [{ name: "Paris" }],
    });
    expect(mockTrackTiming).toHaveBeenCalledWith(
      "towns_data_load_ms",
      expect.any(Number),
      expect.objectContaining({
        result: "success",
        count: towns.length,
      })
    );
  });

  it("sets error, reports it, and announces on validation failure", async () => {
    const err = new Error("bad payload");
    mockValidateTownsData.mockImplementation(() => {
      throw err;
    });

    const { result } = renderHook(() => useTownsData());

    await waitFor(() => expect(result.current.isTownsLoading).toBe(false));
    expect(result.current.townsLoadError).toBe("Failed to load towns");
    expect(mockReportAppError).toHaveBeenCalledWith(
      err,
      expect.objectContaining({ category: "towns-data-load" })
    );
    expect(mockAnnounce).toHaveBeenCalledWith(
      "Failed to load towns",
      "assertive"
    );
    expect(mockTrackTiming).toHaveBeenCalledWith(
      "towns_data_load_ms",
      expect.any(Number),
      expect.objectContaining({ result: "error" })
    );
  });

  it("tracks retry event when retry is requested", async () => {
    mockValidateTownsData.mockReturnValue([]);
    const { result } = renderHook(() => useTownsData());

    await waitFor(() => expect(result.current.isTownsLoading).toBe(false));

    act(() => {
      result.current.retryTownsLoad();
    });

    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: "towns_data_retry_clicked",
    });
    await waitFor(() => expect(mockRetryWithBackoff).toHaveBeenCalled());
  });

  it("uses backoff on user retry and reports retry exhaustion", async () => {
    mockValidateTownsData.mockImplementation(() => {
      throw new Error("chunk load failed");
    });
    mockGetAppErrorMessage.mockImplementation(
      (_error, context?: { category?: string }) => {
        if (context?.category === "towns-data-retry") {
          return "Failed to load data after multiple attempts. Please refresh the page.";
        }
        return "Failed to load towns";
      }
    );
    mockRetryWithBackoff.mockRejectedValue(new Error("chunk load failed"));

    const { result } = renderHook(() => useTownsData());

    await waitFor(() => expect(result.current.isTownsLoading).toBe(false));
    expect(mockRetryWithBackoff).not.toHaveBeenCalled();

    act(() => {
      result.current.retryTownsLoad();
    });

    await waitFor(() =>
      expect(result.current.townsLoadError).toBe(
        "Failed to load data after multiple attempts. Please refresh the page."
      )
    );
    expect(mockReportAppError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ category: "towns-data-retry" })
    );
  });
});
