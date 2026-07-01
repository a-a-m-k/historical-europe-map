import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { useApp } from "@/context/AppContext";
import { TownMarkers } from "@/components/map/MapView/TownMarkers/TownMarkers";
import type { Town } from "@/common/types";
import { renderWithAppProvider } from "../helpers/appProviderTestUtils";
import { createMockYearDataService } from "../helpers/yearDataServiceTestUtils";
import { mockTownsMinimal } from "../helpers/testUtils";

vi.mock("@/utils/markers", () => ({
  disableTownMarkerFocus: vi.fn(),
  getStableTownMarkerId: (town: Town) => town.name,
}));

vi.mock("@/hooks/map", () => ({
  useMarkerKeyboardNavigation: () => vi.fn(),
}));

vi.mock("@/components/map/MapView/TownMarkers/TownMarkerItem", () => ({
  TownMarkerItem: ({ town }: { town: Town }) => (
    <button type="button" data-testid={`marker-${town.name}`}>
      {town.name}
    </button>
  ),
}));

const FilteredTownsProbe = () => {
  const { filteredTowns } = useApp();
  return (
    <div data-testid="filtered-names">
      {filteredTowns.map(town => town.name).join(", ")}
    </div>
  );
};

const MarkerCountProbe = () => {
  const { filteredTowns, selectedYear, setSelectedYear } = useApp();
  return (
    <>
      <button type="button" onClick={() => setSelectedYear(1000)}>
        Select 1000
      </button>
      <div data-testid="filtered-count">{filteredTowns.length}</div>
      <TownMarkers towns={filteredTowns} selectedYear={selectedYear} />
    </>
  );
};

describe("AppProvider year data service injection", () => {
  it("filters towns through an injected year data service", async () => {
    const mockGetFilteredTowns = vi.fn(() => [mockTownsMinimal[0]]);

    renderWithAppProvider(<FilteredTownsProbe />, {
      towns: mockTownsMinimal,
      yearDataService: createMockYearDataService({
        getFilteredTowns: mockGetFilteredTowns,
      }),
    });

    await waitFor(() =>
      expect(screen.getByTestId("filtered-names")).toHaveTextContent("Paris")
    );
    expect(mockGetFilteredTowns).toHaveBeenCalledWith(
      mockTownsMinimal,
      expect.any(Number),
      expect.any(String)
    );
  });

  it("renders one map marker per filtered town for the selected year", async () => {
    renderWithAppProvider(<MarkerCountProbe />, {
      towns: mockTownsMinimal,
    });

    await waitFor(() => {
      expect(screen.getByTestId("filtered-count")).toHaveTextContent("1");
    });
    expect(screen.getAllByTestId(/^marker-/)).toHaveLength(1);
    expect(screen.getByTestId("marker-Paris")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Select 1000" }));

    await waitFor(() => {
      expect(screen.getByTestId("filtered-count")).toHaveTextContent("2");
    });
    expect(screen.getAllByTestId(/^marker-/)).toHaveLength(2);
    expect(screen.getByTestId("marker-London")).toBeInTheDocument();
  });
});
