import type { Town } from "@/common/types";

/** Westernmost town by longitude in the given list. */
export function getWesternmostTown(towns: Town[]): Town | undefined {
  if (towns.length === 0) return undefined;
  return towns.reduce((western, town) =>
    town.longitude < western.longitude ? town : western
  );
}

/** Easternmost town by longitude in the given list. */
export function getEasternmostTown(towns: Town[]): Town | undefined {
  if (towns.length === 0) return undefined;
  return towns.reduce((eastern, town) =>
    town.longitude > eastern.longitude ? town : eastern
  );
}

export function getLongitudeEdgeTowns(towns: Town[]): {
  western: Town | undefined;
  eastern: Town | undefined;
} {
  return {
    western: getWesternmostTown(towns),
    eastern: getEasternmostTown(towns),
  };
}

export function filterTownsByYearLite(towns: Town[], year: number): Town[] {
  const yearKey = String(year);
  return towns.filter(town => {
    const population = town.populationByYear?.[yearKey];
    return population != null && population > 0;
  });
}

export function getLongitudeEdgeTownsForYear(
  towns: Town[],
  year: number
): { western: Town | undefined; eastern: Town | undefined } {
  return getLongitudeEdgeTowns(filterTownsByYearLite(towns, year));
}

/** DOM `data-marker-id` value used by {@link TownMarkerItem}. */
export function getTownMarkerDomId(town: Town): string {
  const lat = Number(town.latitude).toFixed(4);
  const lng = Number(town.longitude).toFixed(4);
  return `marker-${town.name}-${lat}-${lng}`;
}
