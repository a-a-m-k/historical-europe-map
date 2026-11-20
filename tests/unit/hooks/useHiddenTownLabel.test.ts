import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useHiddenTownLabel } from "@/hooks/map/interactions/useHiddenTownLabel";
import { MAP_LABEL_HIDDEN_STATE, MAP_LAYER_SOURCE_ID } from "@/constants/map";

const mapMock = vi.hoisted(() => ({
  hasSource: true,
  handlers: new Map<string, () => void>(),
  getSource: vi.fn(() => (mapMock.hasSource ? {} : undefined)),
  setFeatureState: vi.fn(),
  removeFeatureState: vi.fn(),
  on: vi.fn((event: string, handler: () => void) => {
    mapMock.handlers.set(event, handler);
  }),
  off: vi.fn((event: string) => {
    mapMock.handlers.delete(event);
  }),
}));

vi.mock("react-map-gl/maplibre", () => ({
  useMap: () => ({ current: mapMock }),
}));

const target = (id: string) => ({ source: MAP_LAYER_SOURCE_ID, id });

describe("useHiddenTownLabel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mapMock.hasSource = true;
    mapMock.handlers.clear();
  });

  it("does nothing when no town is focused", () => {
    renderHook(() => useHiddenTownLabel(null));
    expect(mapMock.setFeatureState).not.toHaveBeenCalled();
    expect(mapMock.on).not.toHaveBeenCalled();
  });

  it("hides the focused town label and restores it on change and unmount", () => {
    const { rerender, unmount } = renderHook(
      ({ townId }: { townId: string | null }) => useHiddenTownLabel(townId),
      { initialProps: { townId: "Paris" } }
    );
    expect(mapMock.setFeatureState).toHaveBeenCalledWith(target("Paris"), {
      [MAP_LABEL_HIDDEN_STATE]: true,
    });

    rerender({ townId: "Reims" });
    expect(mapMock.removeFeatureState).toHaveBeenCalledWith(
      target("Paris"),
      MAP_LABEL_HIDDEN_STATE
    );
    expect(mapMock.setFeatureState).toHaveBeenLastCalledWith(target("Reims"), {
      [MAP_LABEL_HIDDEN_STATE]: true,
    });

    unmount();
    expect(mapMock.removeFeatureState).toHaveBeenLastCalledWith(
      target("Reims"),
      MAP_LABEL_HIDDEN_STATE
    );
    expect(mapMock.handlers.has("styledata")).toBe(false);
  });

  it("re-applies after a style swap re-adds the source", () => {
    mapMock.hasSource = false;
    renderHook(() => useHiddenTownLabel("Paris"));
    expect(mapMock.setFeatureState).not.toHaveBeenCalled();

    mapMock.hasSource = true;
    mapMock.handlers.get("styledata")?.();
    expect(mapMock.setFeatureState).toHaveBeenCalledWith(target("Paris"), {
      [MAP_LABEL_HIDDEN_STATE]: true,
    });
  });
});
