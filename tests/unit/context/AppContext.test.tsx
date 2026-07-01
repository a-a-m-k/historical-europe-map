import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Town } from "@/common/types";
import { useApp } from "@/context/AppContext";
import { renderWithAppProvider } from "../../helpers/appProviderTestUtils";
import { mockTownsMinimal } from "../../helpers/testUtils";

const mockLogger = vi.hoisted(() => ({
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
}));

vi.mock("@/utils/logger", () => ({
  logger: mockLogger,
}));

const mockUseYearDataController = vi.hoisted(() =>
  vi.fn(() => ({
    filteredTowns: [] as Town[],
    yearDataError: null,
    retryYearData: vi.fn(),
    isYearDataRetryable: false,
  }))
);

vi.mock("@/context/useYearDataController", () => ({
  useYearDataController: mockUseYearDataController,
}));

const TestComponent = () => {
  const { selectedYear, setSelectedYear, filteredTowns } = useApp();

  return (
    <div>
      <div data-testid="selected-year">{selectedYear}</div>
      <div data-testid="filtered-count">{filteredTowns.length}</div>
      <div data-testid="town-names">
        {filteredTowns.map(town => town.name).join(", ")}
      </div>
      <button data-testid="change-year" onClick={() => setSelectedYear(1200)}>
        Change Year
      </button>
    </div>
  );
};

describe("AppContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseYearDataController.mockReturnValue({
      filteredTowns: [mockTownsMinimal[0]],
      yearDataError: null,
      retryYearData: vi.fn(),
      isYearDataRetryable: false,
    });
  });

  it("provides default selected year and controller data", () => {
    renderWithAppProvider(<TestComponent />, { towns: mockTownsMinimal });

    expect(screen.getByTestId("selected-year")).toHaveTextContent("800");
    expect(screen.getByTestId("filtered-count")).toHaveTextContent("1");
    expect(screen.getByTestId("town-names")).toHaveTextContent("Paris");
  });

  it("updates selected year when valid year is chosen", () => {
    renderWithAppProvider(<TestComponent />, { towns: mockTownsMinimal });

    fireEvent.click(screen.getByTestId("change-year"));
    expect(screen.getByTestId("selected-year")).toHaveTextContent("1200");
  });

  it("should throw error when used outside provider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useApp must be used within an AppProvider");

    consoleSpy.mockRestore();
  });

  it("ignores invalid year and logs a warning", () => {
    const TestComponentWithInvalidYear = () => {
      const { selectedYear, setSelectedYear } = useApp();

      return (
        <>
          <div data-testid="selected-year">{selectedYear}</div>
          <button
            data-testid="invalid-year"
            onClick={() => setSelectedYear(-1)}
          >
            Set Invalid Year
          </button>
        </>
      );
    };

    renderWithAppProvider(<TestComponentWithInvalidYear />, {
      towns: mockTownsMinimal,
    });

    fireEvent.click(screen.getByTestId("invalid-year"));
    expect(screen.getByTestId("selected-year")).toHaveTextContent("800");
    expect(mockLogger.warn).toHaveBeenCalledTimes(1);
  });
});
