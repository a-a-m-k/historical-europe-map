import { useCallback, useEffect, useRef, useState } from "react";

import { getDeviceType, RESIZE_DEBOUNCE_MS } from "@/constants/breakpoints";
import { useResizeDebounced, useViewport } from "@/hooks/ui";
import {
  onMapScreenshotLegendExpand,
  onMapScreenshotLegendRestore,
} from "@/utils/events/mapEvents";

function getInitialExpanded(): boolean {
  if (typeof window === "undefined") return true;
  return getDeviceType(window.innerWidth) !== "mobile";
}

/**
 * Collapse state for the legend body, with screenshot expand/restore hooks.
 * On mobile the legend starts collapsed and re-collapses when the viewport
 * crosses into mobile after resize (debounced via {@link useResizeDebounced}).
 */
export function useLegendExpanded() {
  const { isMobileLayout } = useViewport();
  const isResizing = useResizeDebounced(RESIZE_DEBOUNCE_MS);
  const [isExpanded, setIsExpanded] = useState(getInitialExpanded);
  const toggleExpanded = useCallback(() => {
    setIsExpanded(value => !value);
  }, []);

  const isExpandedRef = useRef(isExpanded);
  const expandedBeforeScreenshotRef = useRef<boolean | null>(null);
  const wasMobileLayoutRef = useRef<boolean | null>(null);

  useEffect(() => {
    isExpandedRef.current = isExpanded;
  }, [isExpanded]);

  useEffect(() => {
    if (isResizing) return;

    const wasMobile = wasMobileLayoutRef.current;
    if (wasMobile === null) {
      wasMobileLayoutRef.current = isMobileLayout;
      if (isMobileLayout) setIsExpanded(false);
      return;
    }

    if (isMobileLayout && !wasMobile) {
      setIsExpanded(false);
    }
    wasMobileLayoutRef.current = isMobileLayout;
  }, [isMobileLayout, isResizing]);

  useEffect(() => {
    const onExpandForScreenshot = () => {
      expandedBeforeScreenshotRef.current = isExpandedRef.current;
      setIsExpanded(true);
    };
    const onRestoreAfterScreenshot = () => {
      const previous = expandedBeforeScreenshotRef.current;
      if (previous !== null) {
        setIsExpanded(previous);
        expandedBeforeScreenshotRef.current = null;
      }
    };

    const cleanupExpand = onMapScreenshotLegendExpand(onExpandForScreenshot);
    const cleanupRestore = onMapScreenshotLegendRestore(onRestoreAfterScreenshot);
    return () => {
      cleanupExpand();
      cleanupRestore();
    };
  }, []);

  return { isExpanded, toggleExpanded };
}
