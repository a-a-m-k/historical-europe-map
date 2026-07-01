import { StyleSpecification } from "react-map-gl/maplibre";
import terrainDarkStyleJson from "@/assets/terrain-gl-style/terrain-dark.json";
import terrainStyleJson from "@/assets/terrain-gl-style/terrain.json";
import { logger } from "@/utils/logger";

/**
 * Light uses `terrain.json`; dark uses `terrain-dark.json` (fork with darkened paints).
 * Population circles/labels render on the same MapLibre instance in both modes.
 */
export type MapBaseStyleMode = "light" | "dark";

const API_KEY_PLACEHOLDER = "{{STADIA_API_KEY}}";

function getStadiaApiKey(): string {
  const apiKey = import.meta.env.VITE_STADIA_API_KEY;

  if (!apiKey) {
    const errorMessage =
      "VITE_STADIA_API_KEY environment variable is not set. " +
      "Please create a .env file with your Stadia Maps API key.";
    logger.error(errorMessage, {
      hasApiKey: !!apiKey,
      envKeys: Object.keys(import.meta.env).filter(k => k.includes("STADIA")),
    });
    throw new Error(errorMessage);
  }

  return apiKey;
}

function replaceApiKeyPlaceholder(obj: unknown, apiKey: string): unknown {
  if (typeof obj === "string") {
    return obj.replace(new RegExp(API_KEY_PLACEHOLDER, "g"), apiKey);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => replaceApiKeyPlaceholder(item, apiKey));
  }

  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceApiKeyPlaceholder(value, apiKey);
    }
    return result;
  }

  return obj;
}

/**
 * Memoized terrain style with API key injected.
 * Calculated once at module load time to avoid recalculating on every render.
 */
let cachedTerrainStyle: StyleSpecification | null = null;

let cachedTerrainDarkStyle: StyleSpecification | null = null;
let hasWarmedStadiaStyleMetadata = false;

function getStadiaStyleWarmupUrls(apiKey: string): string[] {
  return [
    `https://tiles.stadiamaps.com/data/stamen-omt.json?api_key=${apiKey}`,
    `https://tiles.stadiamaps.com/data/stamen_null.json?api_key=${apiKey}`,
    "https://tiles.stadiamaps.com/data/terrarium.json",
    `https://tiles.stadiamaps.com/styles/stamen-terrain/sprite@2x.json?api_key=${apiKey}`,
    `https://tiles.stadiamaps.com/fonts/Open%20Sans%20Regular,Arial%20Unicode%20MS%20Regular/0-255.pbf?api_key=${apiKey}`,
  ];
}

/**
 * Warm up key Stadia style metadata requests so MapLibre can reuse
 * connections/cached responses during initial style bootstrap.
 */
export function warmupStadiaStyleMetadata(): void {
  if (hasWarmedStadiaStyleMetadata) return;
  if (typeof window === "undefined" || typeof fetch !== "function") return;

  let apiKey: string;
  try {
    apiKey = getStadiaApiKey();
  } catch {
    return;
  }

  hasWarmedStadiaStyleMetadata = true;
  for (const url of getStadiaStyleWarmupUrls(apiKey)) {
    fetch(url, {
      method: "GET",
      mode: "no-cors",
      cache: "force-cache",
      credentials: "omit",
      keepalive: true,
    }).catch(() => {
      // Best-effort warmup only.
    });
  }
}

/** Terrain style with API key injected; memoized. */
export function getTerrainStyle(): StyleSpecification {
  if (cachedTerrainStyle) {
    return cachedTerrainStyle;
  }

  const apiKey = getStadiaApiKey();
  cachedTerrainStyle = replaceApiKeyPlaceholder(
    terrainStyleJson,
    apiKey
  ) as StyleSpecification;

  return cachedTerrainStyle;
}

/**
 * Dark basemap: same sources/layers as `terrain.json`, with hsl paints darkened (see
 * `scripts/generate-terrain-dark.mjs`). Regenerate after editing `terrain.json`.
 */
export function getTerrainDarkStyle(): StyleSpecification {
  if (cachedTerrainDarkStyle) {
    return cachedTerrainDarkStyle;
  }

  const apiKey = getStadiaApiKey();
  cachedTerrainDarkStyle = replaceApiKeyPlaceholder(
    terrainDarkStyleJson,
    apiKey
  ) as StyleSpecification;

  return cachedTerrainDarkStyle;
}

/** Terrain style for the active basemap mode (light or dark). */
export function getTerrainStyleForMode(
  mode: MapBaseStyleMode
): StyleSpecification {
  return mode === "dark" ? getTerrainDarkStyle() : getTerrainStyle();
}
