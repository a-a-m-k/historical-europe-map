import { Town } from "@/common/types";
import { MAX_CACHE_SIZE } from "@/constants";
import { filterTownsByYear } from "@/utils/geojson";
import { LRUCache } from "@/utils/cache";
import type { YearDataServiceLike } from "./yearDataService.types";

/** Caches year-filtered towns so switching centuries is cheap. */
class YearDataService implements YearDataServiceLike {
  private filteredTownsCache = new LRUCache<string, Town[]>(MAX_CACHE_SIZE);

  getFilteredTowns(
    towns: Town[],
    year: number,
    townsVersion: string
  ): Town[] {
    const cacheKey = `${townsVersion}:${year}`;
    const cachedData = this.filteredTownsCache.get(cacheKey);
    if (cachedData !== undefined) {
      return cachedData;
    }
    const filteredTowns = filterTownsByYear(towns, year);
    this.filteredTownsCache.set(cacheKey, filteredTowns);
    return filteredTowns;
  }

  clearCache(): void {
    this.filteredTownsCache.clear();
  }

  getCacheStats() {
    const stats = this.filteredTownsCache.getStats();
    return {
      cacheSize: stats.size,
      maxCacheSize: stats.maxSize,
      utilization: stats.utilization,
    };
  }
}

export const yearDataService = new YearDataService();
