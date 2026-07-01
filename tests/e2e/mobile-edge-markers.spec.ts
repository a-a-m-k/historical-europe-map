import { test } from "@playwright/test";

import { selectYearViaTimelineSlider } from "./helpers/selectYear";
import { waitForAppShell } from "./helpers/waitForApp";
import { expectLongitudeEdgeMarkersInsideCanvas } from "./helpers/expectEdgeMarkersInCanvas";
import { MOBILE_DEVICE_VIEWPORTS } from "../helpers/deviceProfiles";

test.describe("Mobile edge marker visibility", () => {
  test("longitude edge markers stay inside the map canvas on Galaxy S21", async ({
    page,
  }) => {
    const { width, height } = MOBILE_DEVICE_VIEWPORTS.galaxyS21;
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await waitForAppShell(page, { strictMapReady: true });

    await selectYearViaTimelineSlider(page, 1300);
    await expectLongitudeEdgeMarkersInsideCanvas(page, 1300);
  });
});
