import { useState, useCallback, useRef, useEffect } from "react";
import { useTheme } from "@mui/material/styles";

import {
  hideMapControls,
  restoreMapControls,
  LEGEND_SCREENSHOT_EXPAND_WAIT_MS,
  dispatchLegendScreenshotExpand,
  dispatchLegendScreenshotRestore,
} from "@/utils/screenshot";
import { useResponsive } from "./useResponsive";
import { dispatchMapScreenshotCaptureState } from "@/utils/events/mapEvents";
import { reportAndAnnounceAppError } from "@/utils/errorPolicy";
import { trackEvent, trackTiming } from "@/utils/observability";

interface UseScreenshotOptions {
  mapContainerSelector?: string;
  filename?: string;
}

/** Capture the map with html2canvas; temporarily hides most chrome (legend attribution kept). */
export const useScreenshot = ({
  mapContainerSelector = "#map-container",
  filename = "map.png",
}: UseScreenshotOptions = {}) => {
  const theme = useTheme();
  const { isMobileLayout } = useResponsive();
  const [isCapturing, setIsCapturing] = useState(false);
  const mountedRef = useRef(true);

  const captureScreenshot = useCallback(async () => {
    if (isCapturing) return;
    const start = performance.now();

    const mapContainer =
      document.querySelector<HTMLElement>(mapContainerSelector);
    if (!mapContainer) {
      const missingContainerError = new Error(
        `Map container not found: ${mapContainerSelector}`
      );
      reportAndAnnounceAppError(missingContainerError, {
        category: "screenshot-capture",
        operation: "querySelector",
      });
      trackEvent({
        name: "screenshot_capture_failed",
        level: "warn",
        data: { reason: "container_missing" },
      });
      return;
    }

    setIsCapturing(true);
    dispatchMapScreenshotCaptureState({ isCapturing: true });
    // Microtask yield so screenshot capture-state subscribers run before html2canvas.
    await Promise.resolve();
    await Promise.resolve();

    const legendToggle = document.querySelector<HTMLElement>(
      '#legend [aria-controls="legend-collapsible"]'
    );
    const legendAlreadyExpanded =
      !legendToggle || legendToggle.getAttribute("aria-expanded") !== "false";

    dispatchLegendScreenshotExpand();

    if (!legendAlreadyExpanded) {
      const expandWaitMs =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 50
          : LEGEND_SCREENSHOT_EXPAND_WAIT_MS;
      await new Promise<void>(resolve => setTimeout(resolve, expandWaitMs));
    }

    let controls: NodeListOf<Element> | null = null;
    let prevDisplay: string[] = [];
    let link: HTMLAnchorElement | null = null;

    try {
      const html2canvas = (await import("html2canvas")).default;

      const hiddenControls = hideMapControls(mapContainer, {
        keepScreenshotButtonVisibleDuringCapture: isMobileLayout,
      });
      controls = hiddenControls.controls;
      prevDisplay = hiddenControls.prevDisplay;

      const canvas = await html2canvas(mapContainer, {
        useCORS: true,
        backgroundColor: theme.palette.background.paper,
        logging: false,
        scale: isMobileLayout ? 1 : 2,
        allowTaint: false,
        foreignObjectRendering: false,
        imageTimeout: 5000,
        onclone: clonedDoc => {
          const legendElements = clonedDoc.querySelectorAll(
            '[aria-label*="Color for"]'
          );
          legendElements.forEach(el => {
            const element = el as HTMLElement;
            element.style.opacity = "1";
            element.style.visibility = "visible";
          });
        },
      });

      const url = canvas.toDataURL("image/png", isMobileLayout ? 1.0 : 0.9);
      link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      trackTiming("screenshot_capture_ms", performance.now() - start, {
        result: "success",
      });

      setTimeout(() => {
        if (link && link.parentNode === document.body) {
          document.body.removeChild(link);
        }
      }, 100);
    } catch (error) {
      reportAndAnnounceAppError(error, {
        category: "screenshot-capture",
        operation: "html2canvas",
      });
      trackTiming("screenshot_capture_ms", performance.now() - start, {
        result: "error",
      });
    } finally {
      dispatchLegendScreenshotRestore();
      dispatchMapScreenshotCaptureState({ isCapturing: false });
      if (controls) {
        restoreMapControls(controls, prevDisplay);
      }
      if (mountedRef.current) setIsCapturing(false);
    }
  }, [isCapturing, mapContainerSelector, filename, theme, isMobileLayout]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { captureScreenshot, isCapturing };
};
