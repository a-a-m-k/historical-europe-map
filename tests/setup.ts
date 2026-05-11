import "@testing-library/jest-dom";
import { vi } from "vitest";

/**
 * `maplibre-gl` sets the worker URL at module load via `URL.createObjectURL`.
 * jsdom often omits blob URL support on `URL`, which yields unhandled rejections
 * and a non-zero Vitest exit code even when individual tests pass.
 */
const urlCtor = globalThis.URL;
if (urlCtor && typeof urlCtor.createObjectURL !== "function") {
  Object.defineProperty(urlCtor, "createObjectURL", {
    value: () => "blob:vitest-maplibre-worker",
    configurable: true,
    writable: true,
  });
}
if (urlCtor && typeof urlCtor.revokeObjectURL !== "function") {
  Object.defineProperty(urlCtor, "revokeObjectURL", {
    value: () => {},
    configurable: true,
    writable: true,
  });
}

const failOnWarnings = process.env.FAIL_ON_TEST_WARNINGS === "1";

if (failOnWarnings) {
  const warningPatterns = [/not wrapped in act/i, /warning:/i, /deprecated/i];

  const makeGuardedConsole =
    (original: (...args: unknown[]) => void) =>
    (...args: unknown[]) => {
      const message = args
        .map(arg => (typeof arg === "string" ? arg : JSON.stringify(arg)))
        .join(" ");

      if (warningPatterns.some(pattern => pattern.test(message))) {
        throw new Error(`Test warning treated as failure: ${message}`);
      }
      original(...args);
    };

  console.warn = makeGuardedConsole(console.warn);
  console.error = makeGuardedConsole(console.error);
}

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
