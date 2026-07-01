import type { Town } from "@/common/types";

/** Deterministic content fingerprint for the static towns bundle (computed once at load). */
export function computeTownsFingerprint(towns: Town[]): string {
  if (towns.length === 0) {
    return "empty";
  }

  const canonicalTowns = [...towns]
    .sort((a, b) => {
      const nameCmp = a.name.localeCompare(b.name);
      if (nameCmp !== 0) return nameCmp;
      if (a.latitude !== b.latitude) return a.latitude - b.latitude;
      return a.longitude - b.longitude;
    })
    .map(town => ({
      name: town.name,
      latitude: town.latitude,
      longitude: town.longitude,
      nameVariants: town.nameVariants ? [...town.nameVariants] : [],
      populationByYear: Object.entries(town.populationByYear ?? {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([y, p]) => [y, p] as const),
    }));

  return JSON.stringify(canonicalTowns);
}
