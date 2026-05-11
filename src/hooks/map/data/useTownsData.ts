import { useState, useEffect } from "react";
import { Town } from "@/common/types";
import { reportAndAnnounceAppError } from "@/utils/errorPolicy";
import { trackEvent, trackTiming } from "@/utils/observability";
import { validateTownsData } from "@/utils/validateTowns";

/**
 * Loads `towns.json` via dynamic `import()` so the main bundle stays small; validates with
 * {@link validateTownsData} and reports failures through {@link reportAndAnnounceAppError}.
 * Incrementing `retryCount` via {@link retryTownsLoad} re-runs the effect.
 *
 * @returns Towns bundle state for {@link MapScreen} / {@link AppProvider}.
 * @returns towns - Parsed towns (empty until load succeeds).
 * @returns isTownsLoading - True until first load attempt finishes (success or error).
 * @returns townsLoadError - User-facing message after failure, or null.
 * @returns retryTownsLoad - Re-triggers fetch/validate (also tracked for analytics).
 */
export const useTownsData = (): {
  towns: Town[];
  isTownsLoading: boolean;
  townsLoadError: string | null;
  retryTownsLoad: () => void;
} => {
  const [towns, setTowns] = useState<Town[]>([]);
  const [isTownsLoading, setIsTownsLoading] = useState<boolean>(true);
  const [townsLoadError, setTownsLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadTowns = async () => {
      const start = performance.now();
      try {
        setIsTownsLoading(true);
        setTownsLoadError(null);

        const townsModule = await import(
          /* webpackChunkName: "towns-data" */
          "@/assets/history-data/towns.json"
        );

        if (cancelled) return;

        const raw = townsModule.default ?? townsModule;
        const townsData = validateTownsData(raw);
        setTowns(townsData);
        trackTiming("towns_data_load_ms", performance.now() - start, {
          result: "success",
          count: townsData.length,
        });
      } catch (err) {
        if (cancelled) return;
        const errorMessage = reportAndAnnounceAppError(err, {
          category: "towns-data-load",
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

  return { towns, isTownsLoading, townsLoadError, retryTownsLoad };
};
