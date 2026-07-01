import { expect, test } from "@playwright/test";

test.describe("Map controls", () => {
  test("toggles map style via keyboard shortcut and persists mode after reload", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    await page.waitForSelector("#map-container-area", { timeout: 20000 });
    await page.locator("#map-container-area").focus();

    const initialMode = await page.evaluate(() =>
      window.localStorage.getItem("historical-europe-map-basemap-style")
    );
    expect(initialMode === null || initialMode === "light").toBe(true);

    await page.keyboard.press("Control+Shift+N");
    await expect
      .poll(async () =>
        page.evaluate(() =>
          window.localStorage.getItem("historical-europe-map-basemap-style")
        )
      )
      .toBe("dark");

    await page.reload();
    await page.waitForSelector("#map-container-area", { timeout: 20000 });
    await expect
      .poll(async () =>
        page.evaluate(() =>
          window.localStorage.getItem("historical-europe-map-basemap-style")
        )
      )
      .toBe("dark");
  });

  test("toggles style mode back to light and updates persisted value", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.addInitScript(() => {
      window.localStorage.setItem("historical-europe-map-basemap-style", "dark");
    });
    await page.goto("/");
    await page.waitForSelector("#map-container-area", { timeout: 20000 });
    await page.locator("#map-container-area").focus();

    await expect
      .poll(async () =>
        page.evaluate(() =>
          window.localStorage.getItem("historical-europe-map-basemap-style")
        )
      )
      .toBe("dark");

    await page.keyboard.press("Control+Shift+N");
    await expect
      .poll(async () =>
        page.evaluate(() =>
          window.localStorage.getItem("historical-europe-map-basemap-style")
        )
      )
      .toBe("light");
  });
});
