import { useEffect, useState, useRef, RefObject } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import { RESIZE_DEBOUNCE_MS } from "@/constants";

/**
 * Observes the map column’s **content box** with `ResizeObserver` and calls `map.resize()` on
 * the primary (and optional secondary) `MapRef` after debounced **window** `resize` so GL dimensions
 * stay correct. Returns `{ width, height }` for {@link useMapViewConfig} / {@link useMapCameraLifecycle}.
 *
 * Attachment retries on `requestAnimationFrame` once so a late-mounted `containerRef` still gets observed.
 *
 * @param containerRef - The div that wraps the map canvas(es).
 * @param mapRef - Overlay map; receives `resize()`.
 * @param secondaryMapRef - Split basemap underlay; also resized when provided.
 * @returns Latest size or `null` before the first observation.
 */
export function useMapContainerResize(
  containerRef: RefObject<HTMLDivElement | null>,
  mapRef: RefObject<MapRef | null>,
  secondaryMapRef?: RefObject<MapRef | null>
): { width: number; height: number } | null {
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let disconnected = false;
    let ro: ResizeObserver | null = null;

    const attach = (el: HTMLDivElement) => {
      if (disconnected || ro) return;
      ro = new ResizeObserver(entries => {
        const entry = entries[0];
        if (entry?.contentRect) {
          const { width, height } = entry.contentRect;
          setContainerSize(prev =>
            prev?.width === width && prev?.height === height
              ? prev
              : { width, height }
          );
        }
      });
      ro.observe(el);
    };

    const tryAttach = () => {
      const el = containerRef.current;
      if (el) {
        attach(el);
        return;
      }
      requestAnimationFrame(() => {
        if (disconnected) return;
        const el2 = containerRef.current;
        if (el2) attach(el2);
      });
    };

    requestAnimationFrame(tryAttach);
    return () => {
      disconnected = true;
      ro?.disconnect();
    };
  }, [containerRef]);

  useEffect(() => {
    const scheduleResize = () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(() => {
        resizeTimeoutRef.current = null;
        mapRef.current?.getMap()?.resize();
        secondaryMapRef?.current?.getMap()?.resize();
      }, RESIZE_DEBOUNCE_MS);
    };
    window.addEventListener("resize", scheduleResize);
    window.addEventListener("orientationchange", scheduleResize);
    return () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      window.removeEventListener("resize", scheduleResize);
      window.removeEventListener("orientationchange", scheduleResize);
    };
  }, [mapRef, secondaryMapRef]);

  useEffect(() => {
    if (!containerSize) return;
    mapRef.current?.getMap()?.resize();
    secondaryMapRef?.current?.getMap()?.resize();
  }, [containerSize, mapRef, secondaryMapRef]);

  return containerSize;
}
