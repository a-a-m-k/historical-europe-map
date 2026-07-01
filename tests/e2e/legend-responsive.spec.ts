import { expect, test } from "@playwright/test";

import { waitForAppShell } from "./helpers/waitForApp";
import { selectYearViaTimelineSlider } from "./helpers/selectYear";

test.describe("Legend responsive layout", () => {
  test("shows mobile legend content and updates year from the timeline", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await waitForAppShell(page);

    const legend = page.getByTestId("legend-mobile");
    await expect(legend).toBeVisible();
    await expect(legend.locator("#legend-heading")).toHaveText(
      "European population"
    );
    await expect(legend.getByText("European towns, 800–1750")).toBeVisible();
    await expect(legend.getByText("~800 AD")).toBeVisible();

    const collapseButton = legend.locator("#legend-collapse-button");
    await expect(collapseButton).toHaveAttribute("aria-expanded", "false");
    await expect(legend.locator("#legend-heading")).toBeHidden();

    await collapseButton.click();
    await expect(collapseButton).toHaveAttribute("aria-expanded", "true");
    await expect(legend.locator("#legend-heading")).toBeVisible();
    await expect(legend.getByText("5k-20k")).toBeVisible();

    await selectYearViaTimelineSlider(page, 1200);
    await expect(legend.getByText("1200s")).toBeVisible();
  });

  test("collapses and expands mobile legend body", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await waitForAppShell(page);

    const legend = page.getByTestId("legend-mobile");
    const collapseButton = legend.locator("#legend-collapse-button");
    await expect(collapseButton).toHaveAttribute("aria-expanded", "false");
    await expect(legend.locator("#legend-heading")).toBeHidden();

    await collapseButton.click();
    await expect(collapseButton).toHaveAttribute("aria-expanded", "true");
    await expect(collapseButton).toHaveAccessibleName(/collapse legend/i);
    await expect(legend.locator("#legend-heading")).toBeVisible();

    await collapseButton.click();
    await expect(collapseButton).toHaveAttribute("aria-expanded", "false");
    await expect(legend.locator("#legend-heading")).toBeHidden();
  });

  test("shows tablet inline map controls in the legend after map is ready", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await waitForAppShell(page, { strictMapReady: true });

    const legend = page.getByTestId("legend-tablet");
    await expect(legend).toBeVisible();
    await expect(legend.locator('[data-legend-header="compact"]')).toBeVisible();

    const inlineScreenshot = legend.locator(
      '[data-testid="screenshot-button"][data-variant="inline"]'
    );
    const inlineReset = legend.locator(
      '[data-testid="map-reset-view-button"][data-variant="inline"]'
    );
    const inlineStyleToggle = legend.locator(
      '[data-testid="map-style-toggle"][data-variant="inline"]'
    );

    await expect(inlineScreenshot).toBeVisible();
    await expect(inlineReset).toBeVisible();
    await expect(inlineStyleToggle).toBeVisible();
  });

  test("collapses and expands tablet legend body", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await waitForAppShell(page);

    const legend = page.getByTestId("legend-tablet");
    const collapseButton = legend.locator("#legend-collapse-button");

    await collapseButton.click();
    await expect(collapseButton).toHaveAttribute("aria-expanded", "false");
    await expect(legend.locator("#legend-heading")).toBeHidden();

    await collapseButton.click();
    await expect(collapseButton).toHaveAttribute("aria-expanded", "true");
    await expect(legend.locator("#legend-heading")).toBeVisible();
  });
});
