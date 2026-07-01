import React, { type ReactElement, type ReactNode } from "react";
import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";

import type { Town } from "@/common/types";
import { AppProvider } from "@/context/AppContext";
import type { YearDataServiceLike } from "@/services";

export type RenderWithAppProviderOptions = {
  towns: Town[];
  /** Defaults to the app singleton via `YearDataServiceProvider`. */
  yearDataService?: YearDataServiceLike;
  /** Renders outside `AppProvider` (e.g. `ThemeProvider`). */
  wrapper?: React.ComponentType<{ children: ReactNode }>;
} & Omit<RenderOptions, "wrapper">;

/** Renders UI inside `AppProvider`, with optional year-data service injection. */
export function renderWithAppProvider(
  ui: ReactElement,
  {
    towns,
    yearDataService,
    wrapper: OuterWrapper,
    ...renderOptions
  }: RenderWithAppProviderOptions
): RenderResult {
  return render(ui, {
    ...renderOptions,
    wrapper: ({ children }) => {
      const tree = (
        <AppProvider towns={towns} yearDataService={yearDataService}>
          {children}
        </AppProvider>
      );
      return OuterWrapper ? <OuterWrapper>{tree}</OuterWrapper> : tree;
    },
  });
}
