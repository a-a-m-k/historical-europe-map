import { describe, it, expect, beforeEach } from "vitest";
import { yearDataService } from "@/services";
import { MAX_CACHE_SIZE } from "@/constants";
import type { Town } from "@/common/types";
import { computeTownsFingerprint } from "@/utils/townsFingerprint";

const makeTowns = (year: number, count = 1): Town[] =>
  Array.from({ length: count }, (_, i) => ({
    name: `Town-${year}-${i}`,
    latitude: 50 + i * 0.1,
    longitude: 10 + i * 0.1,
    populationByYear: { [year]: 1000 },
  }));

describe("YearDataService", () => {
  beforeEach(() => {
    yearDataService.clearCache();
  });

  it("returns same result on cache hit for same towns and year", () => {
    const towns = makeTowns(1000, 2);
    const version = computeTownsFingerprint(towns);
    const first = yearDataService.getFilteredTowns(towns, 1000, version);
    const second = yearDataService.getFilteredTowns(towns, 1000, version);

    expect(second).toBe(first);
    expect(first).toHaveLength(2);
  });

  it("returns different cache entries for different year (different key)", () => {
    const towns = makeTowns(1000, 1);
    towns[0].populationByYear["1200"] = 2000;
    const version = computeTownsFingerprint(towns);

    const for1000 = yearDataService.getFilteredTowns(towns, 1000, version);
    const for1200 = yearDataService.getFilteredTowns(towns, 1200, version);

    expect(for1000).not.toBe(for1200);
    expect(yearDataService.getCacheStats().cacheSize).toBe(2);
  });

  it("uses same cache entry when townsVersion matches across array references", () => {
    const paris: Town = {
      name: "Paris",
      latitude: 48.856613,
      longitude: 2.352222,
      nameVariants: ["Parisius"],
      populationByYear: { "1000": 1000, "1200": 2000 },
    };
    const london: Town = {
      name: "London",
      latitude: 51.507351,
      longitude: -0.127758,
      nameVariants: ["Londinium"],
      populationByYear: { "1000": 900, "1200": 1800 },
    };

    const townsAB = [paris, london];
    const townsBA = [london, paris];
    const version = computeTownsFingerprint(townsAB);

    const first = yearDataService.getFilteredTowns(townsAB, 1000, version);
    const second = yearDataService.getFilteredTowns(townsBA, 1000, version);

    expect(second).toBe(first);
    expect(yearDataService.getCacheStats().cacheSize).toBe(1);
  });

  it("getCacheStats reflects size and utilization", () => {
    const towns = makeTowns(800, 1);
    const version = computeTownsFingerprint(towns);
    yearDataService.getFilteredTowns(towns, 800, version);

    const stats = yearDataService.getCacheStats();
    expect(stats.cacheSize).toBe(1);
    expect(stats.maxCacheSize).toBe(MAX_CACHE_SIZE);
    expect(stats.utilization).toBeGreaterThanOrEqual(0);
  });

  it("clearCache resets cache size to zero", () => {
    const towns = makeTowns(800, 1);
    const version = computeTownsFingerprint(towns);
    yearDataService.getFilteredTowns(towns, 800, version);
    expect(yearDataService.getCacheStats().cacheSize).toBe(1);

    yearDataService.clearCache();
    expect(yearDataService.getCacheStats().cacheSize).toBe(0);
  });

  it("evicts least recently used when over max size", () => {
    const baseYear = 800;
    const numKeys = MAX_CACHE_SIZE + 5;
    const towns = makeTowns(baseYear, 1);
    for (let i = 1; i < numKeys; i++) {
      towns[0].populationByYear[baseYear + i] = 1000;
    }
    const version = computeTownsFingerprint(towns);

    for (let y = baseYear; y < baseYear + numKeys; y++) {
      yearDataService.getFilteredTowns(towns, y, version);
    }

    const stats = yearDataService.getCacheStats();
    expect(stats.cacheSize).toBeLessThanOrEqual(MAX_CACHE_SIZE);
    expect(stats.maxCacheSize).toBe(MAX_CACHE_SIZE);
  });

  it("returns empty list when no towns", () => {
    const result = yearDataService.getFilteredTowns([], 1000, "empty");
    expect(result).toHaveLength(0);
  });
});
