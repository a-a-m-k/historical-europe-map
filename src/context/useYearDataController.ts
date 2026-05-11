import { useCallback, useEffect, useRef, useState } from "react";

import type { Town } from "@/common/types";
import { YEARS } from "@/constants";
import { yearDataService } from "@/services";
import { calculateBoundsCenter } from "@/utils/geoBounds";
import { retryWithBackoff } from "@/utils/retry";
import { reportAndAnnounceAppError } from "@/utils/errorPolicy";
import { trackEvent, trackTiming } from "@/utils/observability";

type UseYearDataControllerArgs = {
  towns: Town[];
  selectedYear: number;
};

export const useYearDataController = ({
  towns,
  selectedYear,
}: UseYearDataControllerArgs) => {
  const [filteredTowns, setFilteredTowns] = useState<Town[]>([]);
  const [isYearDataLoading, setIsYearDataLoading] = useState<boolean>(false);
  const [yearDataError, setYearDataError] = useState<string | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const previousTownsRef = useRef<Town[]>([]);
  /** Ignore completions for years that are no longer selected (avoid race). */
  const currentYearRef = useRef<number>(YEARS[0]);

  const clearYearDataError = useCallback(() => {
    setYearDataError(null);
  }, []);

  const loadYearData = useCallback(
    (year: number, useRetry = false): void => {
      if (!towns || towns.length === 0) {
        const noDataError = new Error("No towns data available");
        const errorMessage = reportAndAnnounceAppError(noDataError, {
          category: "no-towns-data",
          operation: "loadYearData",
          year,
        });
        setYearDataError(errorMessage);
        setFilteredTowns([]);
        return;
      }

      currentYearRef.current = year;
      const requestYear = year;

      const loadData = async (): Promise<void> => {
        const start = performance.now();
        try {
          const yearFilteredTowns = yearDataService.getFilteredTowns(
            towns,
            requestYear
          );
          if (currentYearRef.current !== requestYear) return;
          setFilteredTowns(yearFilteredTowns);
          setYearDataError(null);
          trackTiming("year_change_compute_ms", performance.now() - start, {
            year: requestYear,
            count: yearFilteredTowns.length,
            result: "success",
          });
        } catch (caughtError) {
          if (currentYearRef.current !== requestYear) return;
          const errorMessage = reportAndAnnounceAppError(caughtError, {
            category: "year-data-load",
            operation: "loadData",
            year: requestYear,
          });
          setYearDataError(errorMessage);
          setFilteredTowns([]);
          trackTiming("year_change_compute_ms", performance.now() - start, {
            year: requestYear,
            result: "error",
          });
          throw caughtError;
        }
      };

      if (useRetry) {
        setIsYearDataLoading(true);
        retryWithBackoff(loadData, {
          maxAttempts: 3,
          initialDelay: 1000,
          maxDelay: 5000,
        })
          .catch(caughtError => {
            if (currentYearRef.current !== requestYear) return;
            const errorMessage = reportAndAnnounceAppError(caughtError, {
              category: "year-data-retry",
              operation: "retryWithBackoff",
              year: requestYear,
            });
            setYearDataError(errorMessage);
          })
          .finally(() => {
            if (currentYearRef.current === requestYear)
              setIsYearDataLoading(false);
          });
      } else {
        setIsYearDataLoading(true);
        loadData()
          .catch(() => undefined)
          .finally(() => {
            if (currentYearRef.current === requestYear)
              setIsYearDataLoading(false);
          });
      }
    },
    [towns]
  );

  const retryYearData = useCallback(() => {
    trackEvent({
      name: "year_data_retry_clicked",
      data: { year: selectedYear },
    });
    setYearDataError(null);
    loadYearData(selectedYear, true);
  }, [selectedYear, loadYearData]);

  useEffect(() => {
    if (!towns || towns.length === 0) {
      setFilteredTowns([]);
      isInitializedRef.current = false;
      previousTownsRef.current = [];
      currentYearRef.current = selectedYear;
      return;
    }

    const townsChanged =
      previousTownsRef.current !== towns ||
      previousTownsRef.current.length !== towns.length;

    if (townsChanged) {
      setIsYearDataLoading(true);
      try {
        calculateBoundsCenter(towns);
        isInitializedRef.current = true;
        previousTownsRef.current = towns;
      } catch (caughtError) {
        const errorMessage = reportAndAnnounceAppError(caughtError, {
          category: "initialization",
          operation: "calculateBoundsCenter",
        });
        setYearDataError(errorMessage);
        setFilteredTowns([]);
      } finally {
        setIsYearDataLoading(false);
      }
    }

    currentYearRef.current = selectedYear;
    if (isInitializedRef.current) {
      loadYearData(selectedYear, false);
    }
  }, [selectedYear, loadYearData, towns]);

  return {
    filteredTowns,
    isYearDataLoading,
    yearDataError,
    clearYearDataError,
    retryYearData,
  };
};
