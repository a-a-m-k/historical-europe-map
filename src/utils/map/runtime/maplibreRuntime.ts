type MapLibreModule = typeof import("maplibre-gl");
type MapLibreWithWorker = MapLibreModule & {
  workerClass?: unknown;
};
let maplibrePromise: Promise<MapLibreWithWorker> | null = null;

export const maplibreGl: Promise<MapLibreWithWorker> = (() => {
  if (maplibrePromise) return maplibrePromise;

  maplibrePromise = Promise.all([
    import("maplibre-gl"),
    import("maplibre-gl/dist/maplibre-gl-csp-worker.js?worker"),
  ]).then(([maplibreModule, workerModule]) => {
    const configuredMaplibre = maplibreModule as MapLibreWithWorker;
    const mapLibreWorker = workerModule.default;

    // Use CSP worker build so Rollup can emit a separate worker chunk
    // instead of keeping the whole worker payload inside the main maplibre chunk.
    if (!configuredMaplibre.workerClass) {
      try {
        configuredMaplibre.workerClass = mapLibreWorker;
      } catch {
        // Some runtimes expose a non-writable workerClass; keep default behavior.
      }
    }

    return configuredMaplibre;
  });

  return maplibrePromise;
})();
