import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";

import { Town } from "@/common/types";
import { YEARS } from "@/constants";
import type { YearDataServiceLike } from "@/services";
import { logger } from "@/utils/logger";
import { computeTownsFingerprint } from "@/utils/townsFingerprint";
import { YearDataServiceProvider } from "./YearDataServiceContext";
import { useYearDataController } from "./useYearDataController";

/**
 * Data-only application context: selected year, year-filtered towns, and errors.
 * Raw town bundle stays on `AppProvider`; map initial center/fitZoom use that
 * bundle via props in MapLayout so context doesn't re-render on viewport resize.
 */
interface AppContextType {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  filteredTowns: Town[];
  yearDataError: string | null;
  retryYearData: () => void;
  /** True when re-running year filtering may recover (not for missing/invalid town bundle). */
  isYearDataRetryable: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: React.ReactNode;
  towns: Town[];
  townsVersion?: string | null;
  isTownsLoading?: boolean;
  /** Optional override for tests or alternate data backends. */
  yearDataService?: YearDataServiceLike;
}

const AppProviderInner: React.FC<
  Omit<AppProviderProps, "yearDataService"> & { townsVersion: string | null }
> = ({
  children,
  towns,
  townsVersion,
  isTownsLoading = false,
}) => {
  const [selectedYear, setSelectedYearState] = useState<number>(YEARS[0]);
  const setSelectedYear = useCallback((year: number) => {
    if (!YEARS.includes(year as (typeof YEARS)[number])) {
      logger.warn(
        `Invalid year selected: ${year}. Valid years are: ${YEARS.join(", ")}`
      );
      return;
    }
    setSelectedYearState(year);
  }, []);
  const { filteredTowns, yearDataError, retryYearData, isYearDataRetryable } =
    useYearDataController(
    {
      towns,
      townsVersion,
      selectedYear,
      isTownsLoading,
    }
  );

  const value = useMemo(
    () => ({
      selectedYear,
      setSelectedYear,
      filteredTowns,
      yearDataError,
      retryYearData,
      isYearDataRetryable,
    }),
    [
      selectedYear,
      setSelectedYear,
      filteredTowns,
      yearDataError,
      retryYearData,
      isYearDataRetryable,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

/** Data-only context provider; map camera seeding stays in `MapLayout`. */
export const AppProvider: React.FC<AppProviderProps> = ({
  children,
  towns,
  townsVersion,
  isTownsLoading,
  yearDataService,
}) => (
  <YearDataServiceProvider service={yearDataService}>
    <AppProviderInner
      towns={towns}
      townsVersion={townsVersion ?? computeTownsFingerprint(towns)}
      isTownsLoading={isTownsLoading}
    >
      {children}
    </AppProviderInner>
  </YearDataServiceProvider>
);

/** @throws if used outside `AppProvider` */
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
