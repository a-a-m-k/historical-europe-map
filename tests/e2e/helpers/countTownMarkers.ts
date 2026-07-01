import type { Page } from "@playwright/test";

/** Counts rendered HTML town marker hit targets in the map. */
export async function countVisibleTownMarkers(page: Page): Promise<number> {
  return page.locator(".town-marker-hit-target").count();
}

/** Waits until the visible marker count differs from `previousCount`. */
export async function waitForMarkerCountChange(
  page: Page,
  previousCount: number,
  timeoutMs = 15_000
): Promise<number> {
  await page.waitForFunction(
    prev => document.querySelectorAll(".town-marker-hit-target").length !== prev,
    previousCount,
    { timeout: timeoutMs }
  );
  return countVisibleTownMarkers(page);
}
