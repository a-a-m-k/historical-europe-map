import { useCallback, useEffect, useState } from "react";
import {
  MAP_ACTIVATION_DELAY_MS,
  MAP_ACTIVATION_INTERACTION_EVENTS,
} from "@/constants";
import { isE2ePlaywrightDom } from "@/utils/e2eDom";

const IS_TEST_ENV = import.meta.env.MODE === "test";

/**
 * Defers mounting heavy map overlays (navigation, attribution, etc.) until the map is ready
 * and either the user interacts, the browser is idle, or a short timeout elapses. Reduces
 * main-thread contention during first paint and map initialization.
 *
 * When `mapReady` is false, the hook always returns false. After `mapReady` becomes true,
 * overlays stay off until activation runs: **immediately** in Vitest, **immediately** when
 * `isE2ePlaywrightDom()` is true, or **immediately** if `startActivated` is true; otherwise
 * activation fires on the first of: any event in {@link MAP_ACTIVATION_INTERACTION_EVENTS},
 * `requestIdleCallback` (with {@link MAP_ACTIVATION_DELAY_MS} timeout), or
 * `setTimeout(MAP_ACTIVATION_DELAY_MS)`.
 *
 * @param mapReady - Gate from the map stack (e.g. style loaded / canvas ready). No activation
 *   until this is true.
 * @param options - Optional overrides.
 * @param options.startActivated - If true, skip deferral and treat overlays as active as soon
 *   as `mapReady` is true. Defaults to true in test / Playwright DOM so automation does not
 *   depend on real user input or timers.
 * @returns `true` only when both `mapReady` and the deferred activation have completed; use
 *   this to conditionally render overlay UI.
 */
export function useDeferredOverlayActivation(
  mapReady: boolean,
  options?: { startActivated?: boolean }
): boolean {
  const startActivated =
    options?.startActivated ?? (IS_TEST_ENV || isE2ePlaywrightDom());
  const [isOverlayActivated, setIsOverlayActivated] = useState(startActivated);

  const activateOverlays = useCallback(() => {
    setIsOverlayActivated(true);
  }, []);

  useEffect(() => {
    if (!mapReady || isOverlayActivated) return;
    if (typeof window === "undefined") {
      activateOverlays();
      return;
    }

    let idleCallbackId: number | null = null;
    const timeoutId: ReturnType<typeof globalThis.setTimeout> =
      globalThis.setTimeout(activateOverlays, MAP_ACTIVATION_DELAY_MS);

    if (typeof window.requestIdleCallback === "function") {
      idleCallbackId = window.requestIdleCallback(() => activateOverlays(), {
        timeout: MAP_ACTIVATION_DELAY_MS,
      });
    }

    const interactionListenerOptions: AddEventListenerOptions = { once: true };
    for (const eventName of MAP_ACTIVATION_INTERACTION_EVENTS) {
      window.addEventListener(
        eventName,
        activateOverlays,
        interactionListenerOptions
      );
    }

    return () => {
      for (const eventName of MAP_ACTIVATION_INTERACTION_EVENTS) {
        window.removeEventListener(
          eventName,
          activateOverlays,
          interactionListenerOptions
        );
      }
      if (idleCallbackId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackId);
      }
      clearTimeout(timeoutId);
    };
  }, [activateOverlays, isOverlayActivated, mapReady]);

  return mapReady && isOverlayActivated;
}
