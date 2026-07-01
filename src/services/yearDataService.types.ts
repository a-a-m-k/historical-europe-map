import type { Town } from "@/common/types";

/** Contract for year-scoped town filtering. */
export type YearDataServiceLike = {
  getFilteredTowns(
    towns: Town[],
    year: number,
    townsVersion: string
  ): Town[];
  clearCache(): void;
  getCacheStats(): {
    cacheSize: number;
    maxCacheSize: number;
    utilization: number;
  };
};
