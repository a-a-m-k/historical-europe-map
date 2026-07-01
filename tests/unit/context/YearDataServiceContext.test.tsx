import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { useYearDataService } from "@/context/YearDataServiceContext";
import { YearDataServiceProvider } from "@/context/YearDataServiceContext";
import { createMockYearDataService } from "../../helpers/yearDataServiceTestUtils";

describe("YearDataServiceContext", () => {
  it("throws when useYearDataService is used outside the provider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useYearDataService());
    }).toThrow("useYearDataService must be used within YearDataServiceProvider");

    consoleSpy.mockRestore();
  });

  it("returns the injected service from the provider", () => {
    const mockService = createMockYearDataService();

    const { result } = renderHook(() => useYearDataService(), {
      wrapper: ({ children }) => (
        <YearDataServiceProvider service={mockService}>
          {children}
        </YearDataServiceProvider>
      ),
    });

    expect(result.current).toBe(mockService);
  });
});
