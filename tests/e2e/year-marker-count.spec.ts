import { test, expect } from "@playwright/test";

import { countVisibleTownMarkers, waitForMarkerCountChange } from "./helpers/countTownMarkers";
import { selectYearViaTimelineSlider } from "./helpers/selectYear";
import { waitForAppShell } from "./helpers/waitForApp";

test.describe("Year marker count", () => {
  test("visible marker count tracks year filtering", async ({ page }) => {
    await page.goto("/");
    await waitForAppShell(page, { strictMapReady: true });

    await selectYearViaTimelineSlider(page, 800);
    await page.waitForFunction(
      () => document.querySelectorAll(".town-marker-hit-target").length > 0,
      undefined,
      { timeout: 15_000 }
    );
    const count800 = await countVisibleTownMarkers(page);
    expect(count800).toBeGreaterThan(0);

    await selectYearViaTimelineSlider(page, 1750);
    const count1750 = await waitForMarkerCountChange(page, count800);
    expect(count1750).toBeGreaterThan(count800);
  });
});
