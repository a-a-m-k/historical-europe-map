import React, { type ReactNode } from "react";
import type { RenderHookOptions, RenderHookResult } from "@testing-library/react";
import { renderHook } from "@testing-library/react";

import {
  YearDataServiceProvider,
  useYearDataService,
} from "@/context/YearDataServiceContext";
import type { YearDataServiceLike } from "@/services";

export function createMockYearDataService(
  overrides: Partial<YearDataServiceLike> = {}
): YearDataServiceLike {
  return {
    getFilteredTowns: () => [],
    clearCache: () => undefined,
    getCacheStats: () => ({
      cacheSize: 0,
      maxCacheSize: 0,
      utilization: 0,
    }),
    ...overrides,
  };
}

type YearDataServiceWrapperProps = {
  children: ReactNode;
  service: YearDataServiceLike;
};

function YearDataServiceTestWrapper({
  children,
  service,
}: YearDataServiceWrapperProps) {
  return (
    <YearDataServiceProvider service={service}>{children}</YearDataServiceProvider>
  );
}

/** Renders a hook with an injected year-data service (no module mocking). */
export function renderHookWithYearDataService<Result, Props>(
  callback: (props: Props) => Result,
  service: YearDataServiceLike,
  options?: Omit<RenderHookOptions<Props>, "wrapper">
): RenderHookResult<Result, Props> {
  return renderHook(callback, {
    ...options,
    wrapper: ({ children }) => (
      <YearDataServiceTestWrapper service={service}>
        {children}
      </YearDataServiceTestWrapper>
    ),
  });
}

export { useYearDataService };
