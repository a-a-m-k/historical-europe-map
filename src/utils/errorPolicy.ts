import { announce } from "@/utils/accessibility";
import { getUserFacingMessage } from "./errorMessage";
import { logger } from "./logger";
import { trackEvent } from "./observability";

export type AppErrorCategory =
  | "initialization"
  | "no-towns-data"
  | "towns-data-load"
  | "towns-data-retry"
  | "year-data-load"
  | "validation"
  | "react-error-boundary"
  | "screenshot-capture";

export type AppErrorContext = {
  category: AppErrorCategory;
  operation: string;
  year?: number;
};

const CATEGORY_FALLBACK_MESSAGE: Record<AppErrorCategory, string> = {
  initialization:
    "Failed to load historical data. Please try refreshing the page.",
  "no-towns-data": "No towns data available.",
  "towns-data-load":
    "Failed to load historical data. Please try refreshing the page.",
  "towns-data-retry":
    "Failed to load data after multiple attempts. Please refresh the page.",
  "year-data-load": "Please try again.",
  validation: "Something went wrong. Please try again.",
  "react-error-boundary": "Something went wrong. Please try again.",
  "screenshot-capture": "Could not save map image. Please try again.",
};

export const getAppErrorMessage = (
  error: unknown,
  context: AppErrorContext
): string => {
  const fallback = CATEGORY_FALLBACK_MESSAGE[context.category];
  if (context.year != null && context.category === "year-data-load") {
    return `Failed to load data for year ${context.year}: ${getUserFacingMessage(error, fallback)}`;
  }
  return getUserFacingMessage(error, fallback);
};

export const reportAppError = (
  error: unknown,
  context: AppErrorContext
): void => {
  trackEvent({
    name: "app_error_reported",
    level: "error",
    data: {
      category: context.category,
      operation: context.operation,
      year: context.year,
    },
  });
  logger.error("[app-error]", {
    category: context.category,
    operation: context.operation,
    year: context.year,
    error,
  });
};

/**
 * Reports to analytics/logs, derives a safe user message, announces for screen readers,
 * and returns the message for UI state when needed.
 */
export const reportAndAnnounceAppError = (
  error: unknown,
  context: AppErrorContext
): string => {
  reportAppError(error, context);
  const message = getAppErrorMessage(error, context);
  announce(message, "assertive");
  return message;
};
