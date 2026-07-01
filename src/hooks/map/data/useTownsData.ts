import { useState, useEffect } from "react";
import { Town } from "@/common/types";
import { reportAndAnnounceAppError } from "@/utils/errorPolicy";
import { trackEvent, trackTiming } from "@/utils/observability";
import { retryWithBackoff } from "@/utils/retry";
import { computeTownsFingerprint } from "@/utils/townsFingerprint";
import { validateTownsData } from "@/utils/validateTowns";

/**
 * Loads `towns.json` via dynamic `import()` so the main bundle stays small; validates with
 * {@link validateTownsData} and reports failures through {@link reportAndAnnounceAppError}.
 * Initial load fails fast; user-initiated retry uses {@link retryWithBackoff} for transient
 * chunk-load failures. Incrementing `retryCount` via {@link retryTownsLoad} re-runs the effect.
 *
 * @returns Towns bundle state for {@link MapScreen} / {@link AppProvider}.
 * @returns towns - Parsed towns (empty until load succeeds).
 * @returns townsVersion - Content fingerprint computed once at load (null until success).
 * @returns isTownsLoading - True until first load attempt finishes (success or error).
 * @returns townsLoadError - User-facing message after failure, or null.
 * @returns retryTownsLoad - Re-triggers fetch/validate (also tracked for analytics).
 */
export const useTownsData = (): {
  towns: Town[];
  townsVersion: string | null;
  isTownsLoading: boolean;
  townsLoadError: string | null;
  retryTownsLoad: () => void;
} => {
  const [towns, setTowns] = useState<Town[]>([]);
  const [townsVersion, setTownsVersion] = useState<string | null>(null);
  const [isTownsLoading, setIsTownsLoading] = useState<boolean>(true);
  const [townsLoadError, setTownsLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const isUserRetry = retryCount > 0;

    const fetchTowns = async (): Promise<Town[]> => {
      const townsModule = await import(
        /* webpackChunkName: "towns-data" */
        "@/assets/history-data/towns.json"
      );
      const raw = townsModule.default ?? townsModule;
      return validateTownsData(raw);
    };

    const loadTowns = async () => {
      const start = performance.now();
      try {
        setIsTownsLoading(true);
        setTownsLoadError(null);
        setTownsVersion(null);

        const townsData = isUserRetry
          ? await retryWithBackoff(fetchTowns, {
              maxAttempts: 3,
              initialDelay: 1000,
              maxDelay: 5000,
            })
          : await fetchTowns();

        if (cancelled) return;

        setTowns(townsData);
        setTownsVersion(computeTownsFingerprint(townsData));
        trackTiming("towns_data_load_ms", performance.now() - start, {
          result: "success",
          count: townsData.length,
        });
      } catch (err) {
        if (cancelled) return;
        const errorMessage = reportAndAnnounceAppError(err, {
          category: isUserRetry ? "towns-data-retry" : "towns-data-load",
          operation: "useTownsData.loadTowns",
        });
        setTownsLoadError(errorMessage);
        trackTiming("towns_data_load_ms", performance.now() - start, {
          result: "error",
        });
      } finally {
        if (!cancelled) setIsTownsLoading(false);
      }
    };

    loadTowns();
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  const retryTownsLoad = () => {
    trackEvent({ name: "towns_data_retry_clicked" });
    setRetryCount(c => c + 1);
  };

  return {
    towns,
    townsVersion,
    isTownsLoading,
    townsLoadError,
    retryTownsLoad,
  };
};
