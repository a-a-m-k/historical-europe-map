import { expect, test } from "@playwright/test";

import { waitForAppShell } from "./helpers/waitForApp";

test.describe("Keyboard focus flow", () => {
  test("tabs from timeline to map application region, then to a map overlay control", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    await waitForAppShell(page, { waitForFloatingMapTools: true });

    const styleToggle = page.getByTestId("map-style-toggle");
    await styleToggle.waitFor({ state: "attached", timeout: 15_000 });

    const slider = page.locator("#timeline").getByRole("slider");
    await slider.waitFor({ state: "visible", timeout: 15_000 });
    await slider.focus();
    await expect(slider).toBeFocused();

    const timelineSeenAt = 0;
    let mapAppAt = -1;
    const maxTabs = 80;

    for (let step = 0; step < maxTabs; step++) {
      const id = await page.evaluate(
        () => (document.activeElement as HTMLElement | null)?.id ?? ""
      );
      if (id === "map-container-area" && mapAppAt < 0) {
        mapAppAt = step;
        break;
      }
      await page.keyboard.press("Tab");
    }

    expect(mapAppAt).toBeGreaterThan(timelineSeenAt);

    await expect(page.locator("#map-container-area")).toBeFocused();

    let reachedControl = false;
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
      const onControl = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return false;
        return (
          el.id === "map-style-toggle" ||
          el.id === "map-reset-view-button" ||
          el.id === "map-screenshot-button"
        );
      });
      if (onControl) {
        reachedControl = true;
        break;
      }
    }

    expect(reachedControl).toBe(true);
  });

  test("plain + zoom is ignored off the map and applies with focus on #map-container-area", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    await waitForAppShell(page, { waitForFloatingMapTools: true });

    const mapShell = page.locator(".map-view-shell").first();
    await mapShell.waitFor({ state: "attached", timeout: 15_000 });

    const zoomOut = page.locator(".maplibregl-ctrl-zoom-out").first();
    await zoomOut.waitFor({ state: "visible", timeout: 15_000 });

    const isAtMinZoom = async () =>
      (await mapShell.getAttribute("data-zoom-at-min")) === "";

    for (let i = 0; i < 14; i++) {
      if (await isAtMinZoom()) break;
      await zoomOut.click();
    }
    await expect.poll(async () => isAtMinZoom(), { timeout: 8000 }).toBe(true);

    await page.locator("main").evaluate(el => {
      const sentinel = document.createElement("button");
      sentinel.type = "button";
      sentinel.textContent = "e2e-focus-sentinel";
      sentinel.setAttribute("data-e2e-focus-sentinel", "true");
      sentinel.style.cssText =
        "position:fixed;left:-9999px;top:0;width:1px;height:1px;";
      el.insertBefore(sentinel, el.firstChild);
      sentinel.focus();
    });

    try {
      await page.keyboard.press("NumpadAdd");
      expect(await isAtMinZoom()).toBe(true);

      await page.locator("#map-container-area").focus();
      await expect(page.locator("#map-container-area")).toBeFocused();

      await page.keyboard.press("NumpadAdd");
      await expect
        .poll(async () => isAtMinZoom(), { timeout: 8000 })
        .toBe(false);
    } finally {
      await page
        .locator("[data-e2e-focus-sentinel]")
        .evaluate(el => el.remove());
    }
  });
});
