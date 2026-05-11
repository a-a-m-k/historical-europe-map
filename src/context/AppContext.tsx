import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";

import { Town } from "@/common/types";
import { YEARS } from "@/constants";
import { logger } from "@/utils/logger";
import { useYearDataController } from "./useYearDataController";

/**
 * Data-only application context: year, towns, loading, error.
 * Map initial center/fitZoom are computed in MapLayout via useInitialMapState
 * and passed as props so context doesn't re-render on viewport resize.
 */
interface AppContextType {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  towns: Town[];
  filteredTowns: Town[];
  isYearDataLoading: boolean;
  yearDataError: string | null;
  clearYearDataError: () => void;
  retryYearData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: React.ReactNode;
  towns: Town[];
}

/** Data-only context provider; map camera seeding stays in `MapLayout`. */
export const AppProvider: React.FC<AppProviderProps> = ({
  children,
  towns,
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
  const {
    filteredTowns,
    isYearDataLoading,
    yearDataError,
    clearYearDataError,
    retryYearData,
  } = useYearDataController({
    towns,
    selectedYear,
  });

  const value = useMemo(
    () => ({
      selectedYear,
      setSelectedYear,
      towns,
      filteredTowns,
      isYearDataLoading,
      yearDataError,
      clearYearDataError,
      retryYearData,
    }),
    [
      selectedYear,
      setSelectedYear,
      towns,
      filteredTowns,
      isYearDataLoading,
      yearDataError,
      clearYearDataError,
      retryYearData,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

/** @throws if used outside `AppProvider` */
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
