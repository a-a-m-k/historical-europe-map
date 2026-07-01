import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_STYLE_SWITCH_TIMEOUT_MS = 8000;

interface UseMapStyleSwitchLoaderParams {
  mapStyleMode: string;
  onFirstIdle?: () => void;
  styleSwitchTimeoutMs?: number;
}

interface UseMapStyleSwitchLoaderResult {
  isStyleSwitching: boolean;
  onOverlayIdle: () => void;
}

/**
 * Tracks **map style switch** readiness for the single MapLibre instance.
 *
 * When `mapStyleMode` changes, increments an internal token, sets `isStyleSwitching` true, and
 * waits for overlay `idle`. A timeout clears `isStyleSwitching` if `idle` never arrives (bad network).
 *
 * `onOverlayIdle` doubles as the hook that fires `onFirstIdle` once ever (first overlay idle).
 *
 * @param mapStyleMode - Current basemap mode string (e.g. `"light"` | `"dark"`).
 * @param onFirstIdle - Optional callback the first time the map idles.
 * @param styleSwitchTimeoutMs - Safety cap for a stuck switch spinner.
 * @returns `isStyleSwitching` for UI, plus `onOverlayIdle` to wire to Map `onIdle`.
 */
export function useMapStyleSwitchLoader({
  mapStyleMode,
  onFirstIdle,
  styleSwitchTimeoutMs = DEFAULT_STYLE_SWITCH_TIMEOUT_MS,
}: UseMapStyleSwitchLoaderParams): UseMapStyleSwitchLoaderResult {
  const [isStyleSwitching, setIsStyleSwitching] = useState(false);
  const hasFiredFirstIdleRef = useRef(false);
  const previousMapStyleModeRef = useRef(mapStyleMode);
  const styleSwitchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const overlayIdleDoneRef = useRef(false);
  const styleSwitchTokenRef = useRef(0);

  const tryCompleteStyleSwitch = useCallback(
    (token: number) => {
      if (token !== styleSwitchTokenRef.current) return;
      if (!isStyleSwitching) return;
      if (overlayIdleDoneRef.current) {
        setIsStyleSwitching(false);
        if (styleSwitchTimeoutRef.current) {
          clearTimeout(styleSwitchTimeoutRef.current);
          styleSwitchTimeoutRef.current = null;
        }
      }
    },
    [isStyleSwitching]
  );

  const onOverlayIdle = useCallback(() => {
    if (!hasFiredFirstIdleRef.current) {
      hasFiredFirstIdleRef.current = true;
      onFirstIdle?.();
    }
    overlayIdleDoneRef.current = true;
    tryCompleteStyleSwitch(styleSwitchTokenRef.current);
  }, [onFirstIdle, tryCompleteStyleSwitch]);

  useEffect(() => {
    if (previousMapStyleModeRef.current !== mapStyleMode) {
      previousMapStyleModeRef.current = mapStyleMode;
      setIsStyleSwitching(true);
      const token = ++styleSwitchTokenRef.current;
      overlayIdleDoneRef.current = false;
      if (styleSwitchTimeoutRef.current)
        clearTimeout(styleSwitchTimeoutRef.current);
      // Fallback: avoid a stuck overlay if `idle` never fires (network/style edge cases).
      styleSwitchTimeoutRef.current = setTimeout(() => {
        if (token !== styleSwitchTokenRef.current) return;
        setIsStyleSwitching(false);
        styleSwitchTimeoutRef.current = null;
      }, styleSwitchTimeoutMs);
    }
  }, [mapStyleMode, styleSwitchTimeoutMs]);

  useEffect(() => {
    return () => {
      if (styleSwitchTimeoutRef.current) {
        clearTimeout(styleSwitchTimeoutRef.current);
        styleSwitchTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    isStyleSwitching,
    onOverlayIdle,
  };
}
