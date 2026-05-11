import type { Page } from "@playwright/test";

export type WaitForAppShellOptions = {
  strictMapReady?: boolean;
  waitForFloatingMapTools?: boolean;
};

export async function waitForAppShell(
  page: Page,
  options?: WaitForAppShellOptions
): Promise<void> {
  const APP_READY_TIMEOUT_MS = 25_000;
  const strictMapReady = options?.strictMapReady ?? false;

  try {
    await page
      .locator("#map-container-area")
      .waitFor({ state: "visible", timeout: APP_READY_TIMEOUT_MS });
    await page
      .locator(".maplibregl-canvas")
      .first()
      .waitFor({ state: "visible", timeout: APP_READY_TIMEOUT_MS });
    await page
      .locator("#timeline")
      .getByRole("slider")
      .waitFor({ state: "visible", timeout: APP_READY_TIMEOUT_MS });
  } catch (error) {
    throw new Error(
      `App shell did not become visible within ${APP_READY_TIMEOUT_MS}ms: ${String(error)}`
    );
  }

  const historical = page.getByRole("status", {
    name: /Loading historical data/i,
  });
  if ((await historical.count()) > 0) {
    try {
      await historical
        .first()
        .waitFor({ state: "hidden", timeout: APP_READY_TIMEOUT_MS });
    } catch (error) {
      throw new Error(
        `Historical loading overlay did not hide within ${APP_READY_TIMEOUT_MS}ms: ${String(error)}`
      );
    }
  }

  const readyLocator = page.locator(
    '#map-container-area[data-map-ready="true"]'
  );

  if (strictMapReady) {
    await readyLocator.waitFor({
      state: "visible",
      timeout: APP_READY_TIMEOUT_MS,
    });
  } else {
    try {
      await readyLocator.waitFor({
        state: "visible",
        timeout: APP_READY_TIMEOUT_MS,
      });
    } catch (error) {
      const mapContainer = page.locator("#map-container-area");
      const mapCanvas = page.locator(".maplibregl-canvas").first();
      const spinner = page.getByRole("status", {
        name: /switching map style/i,
      });

      await mapContainer.waitFor({
        state: "visible",
        timeout: APP_READY_TIMEOUT_MS,
      });
      await mapCanvas.waitFor({
        state: "visible",
        timeout: APP_READY_TIMEOUT_MS,
      });
      await page.waitForFunction(() => {
        const mapEl = document.querySelector("#map-container-area");
        if (!mapEl) return false;
        return mapEl.getAttribute("aria-busy") !== "true";
      });
      if ((await spinner.count()) > 0) {
        await spinner
          .first()
          .waitFor({ state: "hidden", timeout: APP_READY_TIMEOUT_MS });
      }

      void error;
    }
  }

  if (options?.waitForFloatingMapTools) {
    await page.locator("html[data-e2e='1']").waitFor({
      state: "attached",
      timeout: 5_000,
    });
    const toggleLocator = page.getByTestId("map-style-toggle");
    if ((await toggleLocator.count()) === 0) {
      await page
        .locator("#map-container-area")
        .click({ position: { x: 60, y: 60 }, force: true, timeout: 5_000 })
        .catch(() => {});
    }
    try {
      await toggleLocator.first().waitFor({
        state: "attached",
        timeout: APP_READY_TIMEOUT_MS,
      });
    } catch (err) {
      const dbg = await page.evaluate(() => ({
        e2e: document.documentElement.dataset.e2e ?? null,
        toggles: document.querySelectorAll('[data-testid="map-style-toggle"]')
          .length,
        overlayGroup: document.querySelectorAll(
          '[data-map-overlay-tool-group="true"]'
        ).length,
        canvases: document.querySelectorAll(".maplibregl-canvas").length,
        mapOverlaysRoot: document.querySelectorAll(
          '[data-testid="map-overlays-root"]'
        ).length,
      }));
      throw new Error(
        `Floating map tools did not mount. Debug: ${JSON.stringify(dbg)}. Cause: ${String(err)}`
      );
    }
  }
}
