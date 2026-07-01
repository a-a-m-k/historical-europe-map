import { z } from "zod";

import { TOWNS_DATA_SCHEMA_VERSION } from "@/constants/townsData";

export { TOWNS_DATA_SCHEMA_VERSION };

const populationValueSchema = z
  .union([z.number(), z.null()])
  .refine(v => v === null || !Number.isNaN(v), {
    message: "population must be a number or null",
  });

const townSchema = z.object({
  name: z.string().trim().min(1, "name must be a non-empty string"),
  latitude: z
    .number()
    .refine(n => !Number.isNaN(n), { message: "latitude must be a number" })
    .min(-90)
    .max(90),
  longitude: z
    .number()
    .refine(n => !Number.isNaN(n), { message: "longitude must be a number" })
    .min(-180)
    .max(180),
  populationByYear: z.record(z.string(), populationValueSchema),
  nameVariants: z.array(z.string()).optional(),
});

export const townsDataFileSchema = z.object({
  schemaVersion: z.literal(TOWNS_DATA_SCHEMA_VERSION),
  towns: z.array(townSchema).min(1, "towns must contain at least one entry"),
});

export type TownsDataFile = z.infer<typeof townsDataFileSchema>;

/**
 * Strict parse for build-time and CI validation. Throws {@link z.ZodError} on failure.
 */
export function parseTownsDataFile(raw: unknown): TownsDataFile {
  return townsDataFileSchema.parse(raw);
}
