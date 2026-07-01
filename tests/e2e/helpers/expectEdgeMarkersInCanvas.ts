import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, type Page } from "@playwright/test";

import type { Town } from "@/common/types";
import { TownsDataFile } from "@/common/types";
import {
  getLongitudeEdgeTownsForYear,
  getTownMarkerDomId,
} from "../../helpers/edgeTownUtilsLite";

const townsPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../src/assets/history-data/towns.json"
);
const allTowns = (JSON.parse(readFileSync(townsPath, "utf-8")) as TownsDataFile)
  .towns;

export async function expectLongitudeEdgeMarkersInsideCanvas(
  page: Page,
  year: number,
  tolerancePx = 2
): Promise<{ western: Town; eastern: Town }> {
  const { western, eastern } = getLongitudeEdgeTownsForYear(allTowns, year);
  if (!western || !eastern) {
    throw new Error(`No longitude edge towns with population for year ${year}`);
  }

  const canvasBox = await page
    .locator(".maplibregl-canvas")
    .first()
    .boundingBox();
  expect(canvasBox).not.toBeNull();

  for (const town of [western, eastern]) {
    const marker = page.locator(
      `[data-marker-id="${getTownMarkerDomId(town)}"]`
    );
    await expect(marker).toBeVisible({ timeout: 15_000 });
    const markerBox = await marker.boundingBox();
    expect(markerBox).not.toBeNull();
    expect(markerBox!.x).toBeGreaterThanOrEqual(canvasBox!.x - tolerancePx);
    expect(markerBox!.y).toBeGreaterThanOrEqual(canvasBox!.y - tolerancePx);
    expect(markerBox!.x + markerBox!.width).toBeLessThanOrEqual(
      canvasBox!.x + canvasBox!.width + tolerancePx
    );
    expect(markerBox!.y + markerBox!.height).toBeLessThanOrEqual(
      canvasBox!.y + canvasBox!.height + tolerancePx
    );
  }

  return { western, eastern };
}
