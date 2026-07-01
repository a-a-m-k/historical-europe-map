import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
  parseTownsDataFile,
  TOWNS_DATA_SCHEMA_VERSION,
  townsDataFileSchema,
} from "@/schemas/townsDataSchema";

describe("townsDataFileSchema", () => {
  const validTown = {
    name: "Paris",
    latitude: 48.85,
    longitude: 2.35,
    populationByYear: { "1000": 20000, "1100": null },
  };

  it("accepts a valid envelope", () => {
    const data = parseTownsDataFile({
      schemaVersion: TOWNS_DATA_SCHEMA_VERSION,
      towns: [validTown],
    });
    expect(data.towns).toHaveLength(1);
    expect(data.schemaVersion).toBe(1);
  });

  it("rejects unknown schemaVersion", () => {
    expect(() =>
      parseTownsDataFile({ schemaVersion: 99, towns: [validTown] })
    ).toThrow(ZodError);
  });

  it("rejects bare town arrays", () => {
    expect(() => parseTownsDataFile([validTown])).toThrow(ZodError);
  });

  it("rejects invalid coordinates", () => {
    const result = townsDataFileSchema.safeParse({
      schemaVersion: 1,
      towns: [{ ...validTown, latitude: 91 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty towns array", () => {
    expect(() =>
      parseTownsDataFile({ schemaVersion: 1, towns: [] })
    ).toThrow(ZodError);
  });
});
