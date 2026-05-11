/** Defers lazy MapLibre mount in MapLayout; pairs with performance marks for activation → first idle. */
import React, { useEffect, useRef, useState } from "react";
import {
  MAP_ACTIVATION_DELAY_MS,
  MAP_ACTIVATION_INTERACTION_EVENTS,
} from "@/constants";
import { isE2ePlaywrightDom } from "@/utils/e2eDom";
import { trackEvent } from "@/utils/observability";

const IS_TEST_ENV = import.meta.env.MODE === "test";

/** Map subtree allowed to mount (pair with {@link MAP_FIRST_IDLE_MARK}). */
export const MAP_ACTIVATION_MARK = "map-activation-start";
/** First overlay map `idle` (set from layout when MapLibre settles). */
export const MAP_FIRST_IDLE_MARK = "map-first-idle";
/** `performance.measure` between activation and first idle. */
export const MAP_ACTIVATION_TO_IDLE_MEASURE = "map-activation-to-first-idle";

/** Records a `performance.mark` when the Performance API exists (used for activation → first-idle measures). */
export function markPerformance(name: string): void {
  if (typeof performance === "undefined") return;
  performance.mark(name);
}

/** Elapsed ms between two marks, or `null` if unavailable. */
export function measurePerformance(
  measureName: string,
  startMark: string,
  endMark: string
): number | null {
  if (typeof performance === "undefined") return null;
  try {
    const measure = performance.measure(measureName, startMark, endMark);
    return measure.duration;
  } catch {
    return null;
  }
}

/**
 * Defers mounting the heavy MapLibre subtree until the sentinel intersects the viewport and the
 * browser is idle (or timeout), or until the user interacts, or when `IntersectionObserver` is
 * missing. Tests and Playwright default to **activated** unless `startActivated: false`.
 * Emits `map_activation_triggered` and {@link MAP_ACTIVATION_MARK}.
 *
 * @param options - Optional overrides.
 * @param options.startActivated - Skip deferral (e.g. unit tests with `false` to test gate behavior).
 * @returns `isMapActivated` — when true, parent may render lazy map; `mapMountGateRef` — attach to
 *   the sentinel element observed for visibility.
 */
export function useMapActivationGate(options?: { startActivated?: boolean }): {
  isMapActivated: boolean;
  mapMountGateRef: React.RefObject<HTMLDivElement | null>;
} {
  const startActivated =
    options?.startActivated ?? (IS_TEST_ENV || isE2ePlaywrightDom());
  const [isMapActivated, setIsMapActivated] = useState(startActivated);
  const mapMountGateRef = useRef<HTMLDivElement>(null);

  const activateMap = React.useCallback(
    (source: "interaction" | "deferred-idle" | "observer-unavailable") => {
      trackEvent({
        name: "map_activation_triggered",
        data: {
          activation_mode: "deferred",
          source,
        },
      });
      markPerformance(MAP_ACTIVATION_MARK);
      setIsMapActivated(true);
    },
    []
  );

  useEffect(() => {
    if (isMapActivated) return;

    const handleInteractionActivation = () => activateMap("interaction");

    for (const eventName of MAP_ACTIVATION_INTERACTION_EVENTS) {
      window.addEventListener(eventName, handleInteractionActivation, {
        once: true,
      });
    }

    return () => {
      for (const eventName of MAP_ACTIVATION_INTERACTION_EVENTS) {
        window.removeEventListener(eventName, handleInteractionActivation);
      }
    };
  }, [activateMap, isMapActivated]);

  useEffect(() => {
    if (isMapActivated) return;
    if (typeof IntersectionObserver === "undefined") {
      activateMap("observer-unavailable");
      return;
    }

    const target = mapMountGateRef.current;
    if (!target) return;

    let idleCallbackId: number | null = null;
    let timeoutId: ReturnType<typeof globalThis.setTimeout> | null = null;
    let activated = false;

    const activateWhenIdle = () => {
      if (activated) return;
      activated = true;
      activateMap("deferred-idle");
    };

    const scheduleDeferredActivation = () => {
      if ("requestIdleCallback" in window) {
        idleCallbackId = window.requestIdleCallback(() => activateWhenIdle(), {
          timeout: MAP_ACTIVATION_DELAY_MS,
        });
      } else {
        timeoutId = globalThis.setTimeout(
          () => activateWhenIdle(),
          MAP_ACTIVATION_DELAY_MS
        );
      }
    };

    const observer = new IntersectionObserver(
      entries => {
        const isVisible = entries.some(
          entry => entry.isIntersecting || entry.intersectionRatio > 0
        );
        if (isVisible) {
          scheduleDeferredActivation();
          observer.disconnect();
        }
      },
      { root: null, rootMargin: "200px", threshold: 0.01 }
    );
    observer.observe(target);

    return () => {
      observer.disconnect();
      if (idleCallbackId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [activateMap, isMapActivated]);

  return { isMapActivated, mapMountGateRef };
}
