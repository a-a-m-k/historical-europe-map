import { describe, expect, it } from "vitest";

import type { Town } from "@/common/types";
import {
  getEasternmostTown,
  getLongitudeEdgeTownsForYear,
  getTownMarkerDomId,
  getWesternmostTown,
} from "../../helpers/edgeTownUtilsLite";
import allTownsData from "@/assets/history-data/towns.json";
import { TownsDataFile } from "@/common/types";

const realTowns = (allTownsData as TownsDataFile).towns;

describe("edgeTownUtils", () => {
  it("picks westernmost and easternmost towns by longitude from the dataset", () => {
    const { western, eastern } = getLongitudeEdgeTownsForYear(realTowns, 1300);
    expect(western).toBeDefined();
    expect(eastern).toBeDefined();
    expect(western!.longitude).toBeLessThan(eastern!.longitude);

    const minLng = Math.min(...realTowns.map(t => t.longitude));
    const maxLng = Math.max(...realTowns.map(t => t.longitude));
    expect(western!.longitude).toBeGreaterThanOrEqual(minLng);
    expect(eastern!.longitude).toBeLessThanOrEqual(maxLng);
  });

  it("builds marker dom ids from town coordinates", () => {
    const town: Town = {
      name: "Example",
      latitude: 10.5,
      longitude: 20.25,
      populationByYear: { "1000": 1 },
    };
    expect(getTownMarkerDomId(town)).toBe("marker-Example-10.5000-20.2500");
  });

  it("returns undefined for empty town lists", () => {
    expect(getWesternmostTown([])).toBeUndefined();
    expect(getEasternmostTown([])).toBeUndefined();
  });
});
