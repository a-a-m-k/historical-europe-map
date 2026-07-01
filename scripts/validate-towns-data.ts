#!/usr/bin/env node
/**
 * Validates src/assets/history-data/towns.json against the Zod contract.
 * Run via prebuild and CI; exits 1 when data breaks the schema.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ZodError } from "zod";

import {
  parseTownsDataFile,
  TOWNS_DATA_SCHEMA_VERSION,
} from "../src/schemas/townsDataSchema";

const townsPath = join(
  process.cwd(),
  "src/assets/history-data/towns.json"
);

function formatZodError(error: ZodError): string {
  return error.issues
    .map(issue => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `  - ${path}: ${issue.message}`;
    })
    .join("\n");
}

function main(): void {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(townsPath, "utf8"));
  } catch (err) {
    console.error(`Failed to read or parse ${townsPath}:`);
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  try {
    const data = parseTownsDataFile(raw);
    console.log(
      `towns.json OK (schemaVersion ${TOWNS_DATA_SCHEMA_VERSION}, ${data.towns.length} towns)`
    );
  } catch (err) {
    console.error(`towns.json failed schema validation (expected schemaVersion ${TOWNS_DATA_SCHEMA_VERSION}):`);
    if (err instanceof ZodError) {
      console.error(formatZodError(err));
    } else {
      console.error(err);
    }
    process.exit(1);
  }
}

main();
