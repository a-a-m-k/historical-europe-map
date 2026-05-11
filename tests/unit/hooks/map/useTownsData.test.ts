import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTownsData } from "@/hooks/map/data/useTownsData";

const mockAnnounce = vi.hoisted(() => vi.fn());
const mockGetAppErrorMessage = vi.hoisted(() => vi.fn());
const mockReportAppError = vi.hoisted(() => vi.fn());
const mockTrackEvent = vi.hoisted(() => vi.fn());
const mockTrackTiming = vi.hoisted(() => vi.fn());
const mockValidateTownsData = vi.hoisted(() => vi.fn());

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

vi.mock("@/assets/history-data/towns.json", () => ({
  default: [{ name: "Paris" }],
}));

describe("useTownsData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAppErrorMessage.mockReturnValue("Failed to load towns");
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
    expect(mockValidateTownsData).toHaveBeenCalledWith([{ name: "Paris" }]);
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
  });
});
