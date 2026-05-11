import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

const coverageArtifactRoot =
  process.env.COVERAGE_ARTIFACT_ROOT ?? ".artifacts/coverage";
const coverageProfile = process.env.COVERAGE_PROFILE ?? "local";
const coverageRunId = process.env.COVERAGE_RUN_ID ?? "default";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    exclude: ["**/node_modules/**", "**/dist/**", "**/tests/e2e/**"],
    testTimeout: 10000, // Increased from 5000ms to handle slow calculations
    // Use threads everywhere (including CI). CI env + `forks` + singleFork leaked one jsdom
    // across files and caused mass failures; fork workers without tuning are also slower.
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: false,
        // Lower parallelism to reduce jsdom memory pressure on local machines.
        maxThreads: 2,
        minThreads: 1,
      },
    },
    // Keep isolation enabled for test safety, but use threads for better performance
    isolate: true,
    sequence: {
      shuffle: false,
    },
    coverage: {
      provider: "v8",
      reportsDirectory:
        process.env.COVERAGE_DIR ??
        `${coverageArtifactRoot}/${coverageProfile}/${coverageRunId}`,
      reporter: process.env.CI
        ? ["text", "json-summary"]
        : ["text", "html", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/assets/**",
      ],
      thresholds: {
        statements: 75,
        branches: 75,
        functions: 70,
        lines: 75,
      },
    },
  },
});
