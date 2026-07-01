import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Town } from "@/common/types";
import { useYearDataService } from "./YearDataServiceContext";
import { calculateBoundsCenter } from "@/utils/geoBounds";
import { announce } from "@/utils/accessibility";
import { getAppErrorMessage, reportAppError } from "@/utils/errorPolicy";
import { trackEvent, trackTiming } from "@/utils/observability";

import type { YearDataServiceLike } from "@/services";

type UseYearDataControllerArgs = {
  towns: Town[];
  townsVersion: string | null;
  selectedYear: number;
  /** When true, empty towns are treated as not-yet-loaded, not a hard error. */
  isTownsLoading?: boolean;
};

type TownsBoundsValidation =
  | { status: "empty" }
  | { status: "ok" }
  | { status: "error"; error: unknown };

type YearDerivation =
  | { status: "empty" }
  | { status: "ok"; filteredTowns: Town[] }
  | { status: "error"; error: unknown };

const validateTownsBounds = (
  towns: Town[],
  townsVersion: string | null
): TownsBoundsValidation => {
  if (!towns?.length || !townsVersion) {
    return { status: "empty" };
  }

  try {
    calculateBoundsCenter(towns);
    return { status: "ok" };
  } catch (error) {
    return { status: "error", error };
  }
};

const deriveYearTowns = (
  towns: Town[],
  selectedYear: number,
  townsVersion: string,
  yearDataService: YearDataServiceLike
): YearDerivation => {
  try {
    return {
      status: "ok",
      filteredTowns: yearDataService.getFilteredTowns(
        towns,
        selectedYear,
        townsVersion
      ),
    };
  } catch (error) {
    return { status: "error", error };
  }
};

const buildAnnouncementKey = (
  derivation: YearDerivation,
  selectedYear: number,
  retryNonce: number,
  isTownsLoading: boolean
): string | null => {
  if (derivation.status === "empty") {
    if (isTownsLoading) return null;
    return `no-towns-data:${selectedYear}:${retryNonce}`;
  }
  if (derivation.status === "error") {
    return `year-data-load:${selectedYear}:${retryNonce}`;
  }
  return null;
};

export const useYearDataController = ({
  towns,
  townsVersion,
  selectedYear,
  isTownsLoading = false,
}: UseYearDataControllerArgs) => {
  const yearDataService = useYearDataService();
  const [retryNonce, setRetryNonce] = useState(0);
  const lastAnnouncedKeyRef = useRef<string | null>(null);

  const townsBoundsValidation = useMemo(
    () => validateTownsBounds(towns, townsVersion),
    [towns, townsVersion]
  );

  const derivation = useMemo((): YearDerivation => {
    if (townsBoundsValidation.status === "empty") {
      return { status: "empty" };
    }
    if (townsBoundsValidation.status === "error") {
      return { status: "error", error: townsBoundsValidation.error };
    }
    // retryNonce is intentionally unused here — it busts this memo on user retry.
    void retryNonce;
    return deriveYearTowns(
      towns,
      selectedYear,
      townsVersion!,
      yearDataService
    );
  }, [
    towns,
    selectedYear,
    townsVersion,
    yearDataService,
    townsBoundsValidation,
    retryNonce,
  ]);

  const { filteredTowns, yearDataError } = useMemo(() => {
    const context = { operation: "loadYearData" as const, year: selectedYear };

    if (derivation.status === "empty") {
      if (isTownsLoading) {
        return { filteredTowns: [] as Town[], yearDataError: null };
      }
      return {
        filteredTowns: [] as Town[],
        yearDataError: getAppErrorMessage(
          new Error("No towns data available"),
          { ...context, category: "no-towns-data" }
        ),
      };
    }

    if (derivation.status === "error") {
      return {
        filteredTowns: [] as Town[],
        yearDataError: getAppErrorMessage(derivation.error, {
          ...context,
          category: "year-data-load",
        }),
      };
    }

    return {
      filteredTowns: derivation.filteredTowns,
      yearDataError: null,
    };
  }, [derivation, isTownsLoading, selectedYear]);

  useEffect(() => {
    const start = performance.now();
    const announcementKey = buildAnnouncementKey(
      derivation,
      selectedYear,
      retryNonce,
      isTownsLoading
    );

    if (derivation.status === "empty") {
      if (isTownsLoading) {
        lastAnnouncedKeyRef.current = null;
        return;
      }
      if (announcementKey && lastAnnouncedKeyRef.current !== announcementKey) {
        reportAppError(new Error("No towns data available"), {
          category: "no-towns-data",
          operation: "loadYearData",
          year: selectedYear,
        });
        if (yearDataError) {
          announce(yearDataError, "assertive");
        }
        lastAnnouncedKeyRef.current = announcementKey;
      }
      return;
    }

    if (derivation.status === "error") {
      if (announcementKey && lastAnnouncedKeyRef.current !== announcementKey) {
        reportAppError(derivation.error, {
          category: "year-data-load",
          operation: "loadYearData",
          year: selectedYear,
        });
        if (yearDataError) {
          announce(yearDataError, "assertive");
        }
        lastAnnouncedKeyRef.current = announcementKey;
      }
      trackTiming("year_change_compute_ms", performance.now() - start, {
        year: selectedYear,
        result: "error",
      });
      return;
    }

    lastAnnouncedKeyRef.current = null;
    trackTiming("year_change_compute_ms", performance.now() - start, {
      year: selectedYear,
      count: derivation.filteredTowns.length,
      result: "success",
    });
  }, [derivation, selectedYear, isTownsLoading, retryNonce, yearDataError]);

  const retryYearData = useCallback(() => {
    trackEvent({
      name: "year_data_retry_clicked",
      data: { year: selectedYear },
    });
    yearDataService.clearCache();
    setRetryNonce(n => n + 1);
  }, [selectedYear, yearDataService]);

  const isYearDataRetryable = useMemo(
    () =>
      townsBoundsValidation.status === "ok" && derivation.status === "error",
    [townsBoundsValidation, derivation]
  );

  return {
    filteredTowns,
    yearDataError,
    retryYearData,
    isYearDataRetryable,
  };
};
