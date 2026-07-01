import { describe, expect, it } from "vitest";

import type { Town } from "@/common/types";
import { computeTownsFingerprint } from "@/utils/townsFingerprint";

describe("computeTownsFingerprint", () => {
  it("returns empty for no towns", () => {
    expect(computeTownsFingerprint([])).toBe("empty");
  });

  it("returns the same fingerprint for equivalent towns in different order", () => {
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

    expect(computeTownsFingerprint([paris, london])).toBe(
      computeTownsFingerprint([london, paris])
    );
  });

  it("returns different fingerprints when town content differs", () => {
    const townA: Town = {
      name: "Paris",
      latitude: 48.856613,
      longitude: 2.352222,
      populationByYear: { "1000": 1000 },
    };
    const townB: Town = {
      ...townA,
      populationByYear: { "1000": 2000 },
    };

    expect(computeTownsFingerprint([townA])).not.toBe(
      computeTownsFingerprint([townB])
    );
  });
});
