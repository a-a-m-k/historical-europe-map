import { logger } from "./logger";

type TelemetryLevel = "info" | "warn" | "error";

type TelemetryData = Record<
  string,
  string | number | boolean | null | undefined
>;

export type TelemetryEvent = {
  name: string;
  level?: TelemetryLevel;
  data?: TelemetryData;
};

/** Lightweight client telemetry: structured log lines for timings and user-flow events. */
export const trackEvent = ({
  name,
  level = "info",
  data,
}: TelemetryEvent): void => {
  const payload = { event: name, ...(data ?? {}) };
  if (level === "error") {
    logger.error("[telemetry:event]", payload);
    return;
  }
  if (level === "warn") {
    logger.warn("[telemetry:event]", payload);
    return;
  }
  logger.info("[telemetry:event]", payload);
};

export const trackTiming = (
  name: string,
  durationMs: number,
  data?: TelemetryData
): void => {
  trackEvent({
    name,
    data: {
      duration_ms: Math.round(durationMs),
      ...(data ?? {}),
    },
  });
};
