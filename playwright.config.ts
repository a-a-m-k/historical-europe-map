import { defineConfig, devices } from "@playwright/test";

const usePreviewServer = process.env.E2E_SERVER_MODE === "preview";
const webServerPort = usePreviewServer
  ? 4173
  : Number(process.env.E2E_DEV_PORT ?? 5174);
const webServerUrl = `http://localhost:${webServerPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { outputFolder: "tests/results/reports/html" }],
    ["json", { outputFile: "tests/results/reports/results.json" }],
    ["list"],
  ],
  use: {
    baseURL: webServerUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  outputDir: "tests/results/e2e-artifacts",
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: [
            "--ignore-gpu-blocklist",
            "--enable-webgl",
            "--enable-webgl2",
            "--enable-unsafe-swiftshader",
          ],
        },
      },
    },
  ],
  webServer: {
    command: usePreviewServer
      ? "VITE_E2E=1 npm run build && VITE_E2E=1 npm run preview -- --host 127.0.0.1 --port 4173"
      : `VITE_E2E=1 npm run dev -- --host 127.0.0.1 --port ${webServerPort}`,
    url: webServerUrl,
    reuseExistingServer: process.env.PW_REUSE_DEV_SERVER === "1",
    timeout: 120 * 1000,
  },
});
