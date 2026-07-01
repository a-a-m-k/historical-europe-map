import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLegendExpanded } from "@/components/legend/useLegendExpanded";

const viewportState = {
  isMobileLayout: false,
};

const resizeState = {
  isResizing: false,
};

vi.mock("@/hooks/ui", () => ({
  useViewport: () => viewportState,
  useResizeDebounced: () => resizeState.isResizing,
}));

vi.mock("@/utils/events/mapEvents", () => ({
  onMapScreenshotLegendExpand: () => () => {},
  onMapScreenshotLegendRestore: () => () => {},
}));

describe("useLegendExpanded", () => {
  beforeEach(() => {
    viewportState.isMobileLayout = false;
    resizeState.isResizing = false;
  });

  it("starts expanded on desktop layout", async () => {
    const { result } = renderHook(() => useLegendExpanded());
    await waitFor(() => expect(result.current.isExpanded).toBe(true));
  });

  it("starts collapsed on mobile layout", async () => {
    viewportState.isMobileLayout = true;
    const { result } = renderHook(() => useLegendExpanded());
    await waitFor(() => expect(result.current.isExpanded).toBe(false));
  });

  it("collapses when viewport crosses into mobile after resize settles", async () => {
    const { result, rerender } = renderHook(() => useLegendExpanded());
    await waitFor(() => expect(result.current.isExpanded).toBe(true));

    resizeState.isResizing = true;
    viewportState.isMobileLayout = true;
    rerender();

    expect(result.current.isExpanded).toBe(true);

    resizeState.isResizing = false;
    rerender();

    await waitFor(() => expect(result.current.isExpanded).toBe(false));
  });

  it("allows manual toggle on mobile", async () => {
    viewportState.isMobileLayout = true;
    const { result } = renderHook(() => useLegendExpanded());
    await waitFor(() => expect(result.current.isExpanded).toBe(false));

    act(() => {
      result.current.toggleExpanded();
    });
    expect(result.current.isExpanded).toBe(true);
  });
});
