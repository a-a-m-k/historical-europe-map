import React, { createContext, useContext, useMemo } from "react";

import type { YearDataServiceLike } from "@/services/yearDataService.types";
import { yearDataService } from "@/services/yearDataService";

const YearDataServiceContext = createContext<YearDataServiceLike | null>(null);

type YearDataServiceProviderProps = {
  children: React.ReactNode;
  /** Defaults to the app singleton; pass a fake in tests or an alternate implementation. */
  service?: YearDataServiceLike;
};

export const YearDataServiceProvider: React.FC<YearDataServiceProviderProps> = ({
  children,
  service = yearDataService,
}) => {
  const value = useMemo(() => service, [service]);

  return (
    <YearDataServiceContext.Provider value={value}>
      {children}
    </YearDataServiceContext.Provider>
  );
};

/** @throws if used outside `YearDataServiceProvider` */
export function useYearDataService(): YearDataServiceLike {
  const service = useContext(YearDataServiceContext);
  if (service === null) {
    throw new Error(
      "useYearDataService must be used within YearDataServiceProvider"
    );
  }
  return service;
}
