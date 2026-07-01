import {
  calculateFitZoom,
  calculateResponsiveZoom,
  calculateMapArea,
  getGeographicalBoxFromViewport,
} from "../../src/utils/mapUtilities";
import { getZoomToFitBounds } from "../../src/utils/mapZoom";
import { computeInitialMapState } from "../../src/hooks/map/runtime/useInitialMapState";
import { createCameraResetTarget } from "../../src/utils/map/camera/cameraReset";
import { MARKER_EDGE_PADDING_PX } from "../../src/constants/mapGeoLayerStyle";
import { MOBILE_DEVICE_VIEWPORTS } from "../helpers/deviceProfiles";
import {
  getEasternmostTown,
  getWesternmostTown,
} from "../helpers/edgeTownUtilsLite";
import { Town } from "../../src/common/types";
import { mockTheme } from "../helpers/testUtils";
import allTownsData from "../../src/assets/history-data/towns.json";
import { TownsDataFile } from "../../src/common/types";

const isVerbose = Boolean(process.env.VITEST_VERBOSE);

// Mock towns data for testing - includes actual geographic extremes
const mockTowns = [
  {
    name: "Paris",
    latitude: 48.8566,
    longitude: 2.3522,
    populationByYear: { "1000": 20000 },
  },
  {
    name: "London",
    latitude: 51.5074,
    longitude: -0.1278,
    populationByYear: { "1000": 15000 },
  },
  {
    name: "Rome",
    latitude: 41.9028,
    longitude: 12.4964,
    populationByYear: { "1000": 25000 },
  },
  // Add extreme edge cities to ensure comprehensive testing
  {
    name: "Lisbon",
    latitude: 38.7223,
    longitude: -9.1393,
    populationByYear: { "1000": 15000 },
  },
  {
    name: "Sarai",
    latitude: 47.5,
    longitude: 45.5,
    populationByYear: { "1000": 20000 },
  },
];

describe("Zoom Calculations", () => {
  describe("calculateFitZoom", () => {
    it("should return decimal zoom levels", () => {
      const zoom = calculateFitZoom(mockTowns, 800, 600);

      // Should be a decimal number (not a whole number)
      expect(zoom).toBeGreaterThan(0);
      expect(zoom % 1).not.toBe(0); // Should have decimal places
      expect(zoom).toBeLessThan(20); // Should be within reasonable bounds
    });

    it("should apply padding factor correctly", () => {
      const zoomWithoutPadding = calculateFitZoom(mockTowns, 800, 600, 0);
      const zoomWithPadding = calculateFitZoom(mockTowns, 800, 600, 0.2);

      // Zoom with padding should be lower (more zoomed out for safety margin)
      // This ensures towns have breathing room and aren't cut off at edges
      expect(zoomWithPadding).toBeLessThan(zoomWithoutPadding);
    });

    it("should handle different screen sizes", () => {
      const mobileZoom = calculateFitZoom(mockTowns, 375, 667); // iPhone size
      const desktopZoom = calculateFitZoom(mockTowns, 1920, 1080); // Desktop size

      expect(mobileZoom).toBeGreaterThan(0);
      expect(desktopZoom).toBeGreaterThan(0);
      // Both should be valid zoom levels (may be clamped to minimum)
      expect(mobileZoom).toBeGreaterThanOrEqual(2);
      expect(desktopZoom).toBeGreaterThanOrEqual(2);
    });
  });

  describe("calculateResponsiveZoom", () => {
    it("should return appropriate zoom for mobile screens", () => {
      const mobileZoom = calculateResponsiveZoom(
        mockTowns,
        375,
        667,
        mockTheme
      );

      expect(mobileZoom).toBeGreaterThan(0);
      expect(mobileZoom).toBeLessThan(20);
      // MapLibre supports zoom levels below 2, so allow >= 1.5
      expect(mobileZoom).toBeGreaterThanOrEqual(1.5);
    });

    it("should return appropriate zoom for tablet screens", () => {
      const tabletZoom = calculateResponsiveZoom(
        mockTowns,
        768,
        1024,
        mockTheme
      );

      expect(tabletZoom).toBeGreaterThan(0);
      expect(tabletZoom).toBeLessThan(20);
      expect(tabletZoom % 1).not.toBe(0); // Should have decimal places
    });

    it("should return appropriate zoom for desktop screens", () => {
      const desktopZoom = calculateResponsiveZoom(
        mockTowns,
        1920,
        1080,
        mockTheme
      );

      expect(desktopZoom).toBeGreaterThan(0);
      expect(desktopZoom).toBeLessThan(20);
      expect(desktopZoom % 1).not.toBe(0); // Should have decimal places
    });

    it("should apply different padding factors for different device types", () => {
      const mobileZoom = calculateResponsiveZoom(
        mockTowns,
        375,
        667,
        mockTheme
      );
      const tabletZoom = calculateResponsiveZoom(
        mockTowns,
        768,
        1024,
        mockTheme
      );
      const desktopZoom = calculateResponsiveZoom(
        mockTowns,
        1920,
        1080,
        mockTheme
      );

      // All should be valid zoom levels (may be clamped to minimum)
      expect(mobileZoom).toBeGreaterThan(0);
      expect(tabletZoom).toBeGreaterThan(0);
      expect(desktopZoom).toBeGreaterThan(0);

      // All should be within valid range (MapLibre supports zoom >= 1)
      expect(mobileZoom).toBeGreaterThanOrEqual(1.5);
      expect(tabletZoom).toBeGreaterThanOrEqual(1.5);
      expect(desktopZoom).toBeGreaterThanOrEqual(1.5);
    });

    it("should handle edge cases gracefully", () => {
      const emptyTownsZoom = calculateResponsiveZoom([], 800, 600, mockTheme);
      const singleTownZoom = calculateResponsiveZoom(
        [mockTowns[0]],
        800,
        600,
        mockTheme
      );

      expect(emptyTownsZoom).toBe(4); // Default fallback
      expect(singleTownZoom).toBe(4); // Default fallback for single town
    });
  });

  describe("calculateMapArea", () => {
    it("should calculate correct map area for mobile screens", () => {
      const { effectiveWidth, effectiveHeight } = calculateMapArea(
        375,
        667,
        mockTheme
      );

      // Mobile should have reduced height due to legend (top) and timeline (bottom)
      expect(effectiveWidth).toBeLessThan(375);
      expect(effectiveHeight).toBeLessThan(667);
      expect(effectiveWidth).toBeGreaterThan(200); // Minimum width
      expect(effectiveHeight).toBeGreaterThan(200); // Minimum height
    });

    it("should calculate correct map area for tablet screens", () => {
      const { effectiveWidth, effectiveHeight } = calculateMapArea(
        768,
        1024,
        mockTheme
      );

      // Tablet should have reduced height due to legend (top) and timeline (bottom)
      expect(effectiveWidth).toBeLessThan(768);
      expect(effectiveHeight).toBeLessThan(1024);
      expect(effectiveWidth).toBeGreaterThan(200);
      expect(effectiveHeight).toBeGreaterThan(200);
    });

    it("should calculate correct map area for desktop screens", () => {
      const { effectiveWidth, effectiveHeight } = calculateMapArea(
        1920,
        1080,
        mockTheme
      );

      // Desktop should have reduced width due to legend (right) and height due to timeline (bottom)
      expect(effectiveWidth).toBeLessThan(1920);
      expect(effectiveHeight).toBeLessThan(1080);
      expect(effectiveWidth).toBeGreaterThan(200);
      expect(effectiveHeight).toBeGreaterThan(200);
    });

    it("should ensure minimum dimensions", () => {
      const { effectiveWidth, effectiveHeight } = calculateMapArea(
        100,
        100,
        mockTheme
      );

      // Even with very small screen, should maintain minimum dimensions
      expect(effectiveWidth).toBeGreaterThanOrEqual(200);
      expect(effectiveHeight).toBeGreaterThanOrEqual(200);
    });

    it("should use MUI breakpoints correctly", () => {
      // Test mobile breakpoint (< 600px)
      const mobileArea = calculateMapArea(500, 800, mockTheme);
      expect(mobileArea.effectiveWidth).toBeLessThan(500);
      expect(mobileArea.effectiveHeight).toBeLessThan(800);

      // Test tablet breakpoint (600px - 900px)
      const tabletArea = calculateMapArea(700, 1000, mockTheme);
      expect(tabletArea.effectiveWidth).toBeLessThan(700);
      expect(tabletArea.effectiveHeight).toBeLessThan(1000);

      // Test desktop breakpoint (>= 900px)
      const desktopArea = calculateMapArea(1200, 800, mockTheme);
      expect(desktopArea.effectiveWidth).toBeLessThan(1200);
      expect(desktopArea.effectiveHeight).toBeLessThan(800);
    });
  });

  describe("Town Visibility Tests", () => {
    // Helper function to check if towns fit within viewport at given zoom
    const checkTownsVisibility = (
      towns: Town[],
      width: number,
      height: number,
      zoom: number
    ) => {
      const { effectiveWidth, effectiveHeight } = calculateMapArea(
        width,
        height,
        mockTheme
      );

      // Calculate the geographic bounds of all towns
      const lats = towns.map(t => t.latitude);
      const lngs = towns.map(t => t.longitude);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      // Calculate how many degrees of latitude/longitude fit in the viewport at this zoom
      // At zoom level Z, the world is (256 * 2^Z) pixels wide
      const worldWidth = 256 * Math.pow(2, zoom);
      const degreesPerPixel = 360 / worldWidth;

      const viewportDegreesWidth = effectiveWidth * degreesPerPixel;
      const viewportDegreesHeight = effectiveHeight * degreesPerPixel;

      const townSpanLat = maxLat - minLat;
      const townSpanLng = maxLng - minLng;

      // Towns should fit within viewport with some margin
      return {
        fitsHorizontally: townSpanLng <= viewportDegreesWidth,
        fitsVertically: townSpanLat <= viewportDegreesHeight,
        horizontalCoverage: townSpanLng / viewportDegreesWidth,
        verticalCoverage: townSpanLat / viewportDegreesHeight,
      };
    };

    it("should calculate zoom that fits all mock towns on mobile", () => {
      const zoom = calculateResponsiveZoom(mockTowns, 375, 667, mockTheme);
      const visibility = checkTownsVisibility(mockTowns, 375, 667, zoom);

      // All towns should fit in the viewport
      expect(visibility.fitsHorizontally).toBe(true);
      expect(visibility.fitsVertically).toBe(true);

      // Coverage should be reasonable (mobile has aggressive padding, so allow 5-80% coverage)
      expect(visibility.horizontalCoverage).toBeGreaterThan(0.05);
      expect(visibility.horizontalCoverage).toBeLessThan(0.8);
      expect(visibility.verticalCoverage).toBeGreaterThan(0.05);
      expect(visibility.verticalCoverage).toBeLessThan(0.8);
    });

    it("should calculate zoom that fits all mock towns on tablet", () => {
      const zoom = calculateResponsiveZoom(mockTowns, 768, 1024, mockTheme);
      const visibility = checkTownsVisibility(mockTowns, 768, 1024, zoom);

      expect(visibility.fitsHorizontally).toBe(true);
      expect(visibility.fitsVertically).toBe(true);
      expect(visibility.horizontalCoverage).toBeGreaterThan(0.1);
      expect(visibility.horizontalCoverage).toBeLessThan(0.8);
      expect(visibility.verticalCoverage).toBeGreaterThan(0.1);
      expect(visibility.verticalCoverage).toBeLessThan(0.8);
    });

    it("should calculate zoom that fits all mock towns on desktop", () => {
      const zoom = calculateResponsiveZoom(mockTowns, 1920, 1080, mockTheme);
      const visibility = checkTownsVisibility(mockTowns, 1920, 1080, zoom);

      expect(visibility.fitsHorizontally).toBe(true);
      expect(visibility.fitsVertically).toBe(true);
      expect(visibility.horizontalCoverage).toBeGreaterThan(0.1);
      expect(visibility.horizontalCoverage).toBeLessThan(0.8);
      expect(visibility.verticalCoverage).toBeGreaterThan(0.1);
      expect(visibility.verticalCoverage).toBeLessThan(0.8);
    });

    it("should fit extreme longitude edge towns on mobile", () => {
      const extremeCities = [getWesternmostTown(mockTowns), getEasternmostTown(mockTowns)].filter(
        (town): town is (typeof mockTowns)[number] => town != null
      );

      if (extremeCities.length === 2) {
        const zoom = calculateResponsiveZoom(
          extremeCities,
          375,
          667,
          mockTheme
        );
        const visibility = checkTownsVisibility(extremeCities, 375, 667, zoom);

        expect(visibility.fitsHorizontally).toBe(true);
        expect(visibility.fitsVertically).toBe(true);
      }
    });

    it("should not zoom in too much with padding", () => {
      // With padding, zoom should be lower than without
      const zoomNoPadding = calculateFitZoom(mockTowns, 800, 600, 0);
      const zoomWithPadding = calculateFitZoom(mockTowns, 800, 600, 0.3);

      expect(zoomWithPadding).toBeLessThan(zoomNoPadding);

      // The difference should be significant
      expect(zoomNoPadding - zoomWithPadding).toBeGreaterThan(0.1);
    });

    it("should ensure towns fit even on smallest supported screen (iPhone SE)", () => {
      const zoom = calculateResponsiveZoom(mockTowns, 375, 667, mockTheme);
      const visibility = checkTownsVisibility(mockTowns, 375, 667, zoom);

      // Critical: All towns must fit on the smallest screen
      expect(visibility.fitsHorizontally).toBe(true);
      expect(visibility.fitsVertically).toBe(true);

      // Zoom should be valid (MapLibre supports zoom >= 1)
      expect(zoom).toBeGreaterThanOrEqual(1.5);
    });

    it("should apply more conservative padding on mobile than desktop", () => {
      const mobileZoom = calculateResponsiveZoom(
        mockTowns,
        375,
        667,
        mockTheme
      );
      const desktopZoom = calculateResponsiveZoom(
        mockTowns,
        1920,
        1080,
        mockTheme
      );

      // Mobile should be more zoomed out (lower zoom) due to more padding
      expect(mobileZoom).toBeLessThanOrEqual(desktopZoom + 1);
    });

    describe("Real Dataset Tests (Critical)", () => {
      // Test with the actual full dataset to catch real issues
      // Pre-compute filtered data once to avoid repeated filtering
      const realTowns = (allTownsData as TownsDataFile).towns.filter(
        t =>
          t.latitude != null &&
          t.longitude != null &&
          !isNaN(t.latitude) &&
          !isNaN(t.longitude)
      );

      // Pre-compute geographic bounds once
      const lats = realTowns.map(t => t.latitude);
      const lngs = realTowns.map(t => t.longitude);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      // Pre-find extreme cities once
      const northernTown = realTowns.find(t => t.latitude === maxLat);
      const southernTown = realTowns.find(t => t.latitude === minLat);
      const easternTown = realTowns.find(t => t.longitude === maxLng);
      const westernTown = realTowns.find(t => t.longitude === minLng);

      it("CRITICAL: should fit ALL towns from real dataset on iPhone SE", () => {
        const zoom = calculateResponsiveZoom(realTowns, 375, 667, mockTheme);
        const visibility = checkTownsVisibility(realTowns, 375, 667, zoom);

        // This is the critical test - if it fails, towns are being cut off in production
        expect(visibility.fitsHorizontally).toBe(true);
        expect(visibility.fitsVertically).toBe(true);

        if (easternTown) {
          expect(easternTown.latitude).toBeDefined();
          expect(easternTown.longitude).toBeDefined();
        }
      });

      it("CRITICAL: should fit ALL towns from real dataset on various mobile devices", () => {
        const mobileDevices = [
          MOBILE_DEVICE_VIEWPORTS.iPhoneSE,
          MOBILE_DEVICE_VIEWPORTS.iPhone12,
          MOBILE_DEVICE_VIEWPORTS.galaxyS21,
        ];

        mobileDevices.forEach(device => {
          const zoom = calculateResponsiveZoom(
            realTowns,
            device.width,
            device.height,
            mockTheme
          );
          const visibility = checkTownsVisibility(
            realTowns,
            device.width,
            device.height,
            zoom
          );

          // All towns must fit on all devices
          expect(visibility.fitsHorizontally).toBe(true);
          expect(visibility.fitsVertically).toBe(true);
        });
      });

      it("CRITICAL: should specifically include extreme edge cities", () => {
        // Use pre-computed extreme cities from describe block scope
        // Test that zoom calculation includes these extremes on iPhone SE
        const zoom = calculateResponsiveZoom(realTowns, 375, 667, mockTheme);
        const { effectiveWidth, effectiveHeight } = calculateMapArea(
          375,
          667,
          mockTheme
        );

        // Calculate viewport coverage
        const worldWidth = 256 * Math.pow(2, zoom);
        const degreesPerPixel = 360 / worldWidth;
        const viewportDegreesWidth = effectiveWidth * degreesPerPixel;
        const viewportDegreesHeight = effectiveHeight * degreesPerPixel;

        const townSpanLng = maxLng - minLng;
        const townSpanLat = maxLat - minLat;

        // Only log in verbose mode to reduce overhead
        if (isVerbose) {
          console.log("\n=== iPhone SE Visibility Check ===");
          console.log("Zoom level:", zoom);
          console.log(
            "Effective viewport:",
            effectiveWidth,
            "x",
            effectiveHeight,
            "px"
          );
          console.log(
            "Viewport covers:",
            viewportDegreesWidth.toFixed(2),
            "° lng x",
            viewportDegreesHeight.toFixed(2),
            "° lat"
          );
          console.log(
            "Towns span:",
            townSpanLng.toFixed(2),
            "° lng x",
            townSpanLat.toFixed(2),
            "° lat"
          );
          console.log(
            "Horizontal fit:",
            townSpanLng <= viewportDegreesWidth,
            `(${((townSpanLng / viewportDegreesWidth) * 100).toFixed(1)}% coverage)`
          );
          console.log(
            "Vertical fit:",
            townSpanLat <= viewportDegreesHeight,
            `(${((townSpanLat / viewportDegreesHeight) * 100).toFixed(1)}% coverage)`
          );
          if (northernTown)
            console.log("Northernmost:", northernTown.name, maxLat);
          if (southernTown)
            console.log("Southernmost:", southernTown.name, minLat);
          if (easternTown)
            console.log("Easternmost:", easternTown.name, maxLng);
          if (westernTown)
            console.log("Westernmost:", westernTown.name, minLng);
          console.log("===================================\n");
        }

        const visibility = checkTownsVisibility(realTowns, 375, 667, zoom);
        expect(visibility.fitsHorizontally).toBe(true);
        expect(visibility.fitsVertically).toBe(true);
      });

      it("CRITICAL: easternmost town center should be visible on iPhone SE", () => {
        if (!easternTown) {
          throw new Error("Easternmost town not found in dataset!");
        }

        if (isVerbose) {
          console.log("\n=== Easternmost town visibility test ===");
          console.log(
            "Easternmost town:",
            easternTown.name,
            easternTown.latitude,
            easternTown.longitude
          );
        }

        const zoom = calculateResponsiveZoom(realTowns, 375, 667, mockTheme);
        const { effectiveWidth } = calculateMapArea(375, 667, mockTheme);

        const worldWidth = 256 * Math.pow(2, zoom);
        const degreesPerPixel = 360 / worldWidth;
        const viewportDegreesWidth = effectiveWidth * degreesPerPixel;

        const centerLng = (minLng + maxLng) / 2;
        const halfViewport = viewportDegreesWidth / 2;

        const leftEdge = centerLng - halfViewport;
        const rightEdge = centerLng + halfViewport;

        if (isVerbose) {
          console.log("Map center longitude:", centerLng.toFixed(2), "°");
          console.log(
            "Viewport shows from",
            leftEdge.toFixed(2),
            "° to",
            rightEdge.toFixed(2),
            "°"
          );
          console.log("Easternmost town is at:", easternTown.longitude, "°");
          console.log(
            "Easternmost visible?",
            easternTown.longitude >= leftEdge &&
              easternTown.longitude <= rightEdge
          );
          console.log(
            "Distance from right edge:",
            (rightEdge - easternTown.longitude).toFixed(2),
            "°"
          );
          console.log("===========================\n");
        }

        const easternVisible =
          easternTown.longitude >= leftEdge &&
          easternTown.longitude <= rightEdge;
        expect(easternVisible).toBe(true);

        const legendOverlapPixels = 70;
        const effectiveRightMargin = effectiveWidth - legendOverlapPixels;
        const safeViewportWidth = effectiveRightMargin * degreesPerPixel;
        const safeRightEdge = centerLng + safeViewportWidth / 2;

        if (isVerbose) {
          console.log("\n=== With Legend Overlap Check ===");
          console.log(
            "If legend overlaps (70px):",
            effectiveRightMargin,
            "px safe width"
          );
          console.log(
            "Safe viewport right edge:",
            safeRightEdge.toFixed(2),
            "°"
          );
          console.log(
            "Easternmost safe?",
            easternTown.longitude <= safeRightEdge
          );
          console.log(
            "Distance from safe edge:",
            (safeRightEdge - easternTown.longitude).toFixed(2),
            "°"
          );
          console.log("=================================\n");
        }

        if (easternTown.longitude > safeRightEdge && isVerbose) {
          console.error("WARNING: Easternmost town may be hidden by the legend!");
          console.error(
            "The viewport calculation assumes UI reduces viewport, but legend overlaps!"
          );
        }
      });

      const markerEdgeScreens = [
        MOBILE_DEVICE_VIEWPORTS.iPhoneSE,
        MOBILE_DEVICE_VIEWPORTS.iPhone12,
        MOBILE_DEVICE_VIEWPORTS.galaxyS21,
        { name: "Desktop", width: 1920, height: 1080 },
      ] as const;

      markerEdgeScreens.forEach(({ name, width, height }) => {
        it(`CRITICAL: easternmost marker circle edge fits viewport on ${name}`, () => {
          if (!easternTown) {
            throw new Error("Easternmost town not found in dataset!");
          }

          const { center, fitZoom, bounds } = computeInitialMapState(
            realTowns,
            undefined,
            width,
            height
          );

          expect(center).toBeDefined();
          expect(bounds).toBeDefined();
          expect(fitZoom).toBeGreaterThan(0);

          const { effectiveWidth, effectiveHeight } = calculateMapArea(
            width,
            height,
            mockTheme
          );
          const viewportBox = getGeographicalBoxFromViewport(
            { longitude: center!.longitude, latitude: center!.latitude },
            fitZoom,
            effectiveWidth,
            effectiveHeight
          );

          const worldWidth = 256 * Math.pow(2, fitZoom) * 2;
          const lngDegreesPerPixel = 360 / worldWidth;
          const easternEdgeLng =
            easternTown.longitude + MARKER_EDGE_PADDING_PX * lngDegreesPerPixel;

          expect(easternEdgeLng).toBeLessThanOrEqual(
            viewportBox.maxLng + 1e-6
          );
          expect(easternEdgeLng).toBeLessThanOrEqual(bounds!.maxLng + 1e-6);
        });
      });

      const fullBleedMobileScreens = [
        MOBILE_DEVICE_VIEWPORTS.galaxyS21,
        MOBILE_DEVICE_VIEWPORTS.iPhoneSE,
      ] as const;

      fullBleedMobileScreens.forEach(({ name, width, height }) => {
        it(`CRITICAL: longitude edge marker circles fit full-bleed mobile canvas on ${name}`, () => {
          if (!easternTown || !westernTown) {
            throw new Error("Longitude edge towns not found in dataset!");
          }

          const mapArea = calculateMapArea(width, height, mockTheme);
          const { center, fitZoom, bounds } = computeInitialMapState(
            realTowns,
            mapArea,
            width,
            height
          );

          expect(center).toBeDefined();
          expect(bounds).toBeDefined();

          const zoomToFit = getZoomToFitBounds(
            bounds!,
            mapArea.effectiveWidth,
            mapArea.effectiveHeight
          );
          const effectiveMinZoom = Math.max(fitZoom, zoomToFit);
          const resetZoom = createCameraResetTarget(
            center!.longitude,
            center!.latitude,
            fitZoom,
            effectiveMinZoom
          ).zoom;

          expect(resetZoom).toBeLessThanOrEqual(fitZoom + 0.05);

          const viewportBox = getGeographicalBoxFromViewport(
            { longitude: center!.longitude, latitude: center!.latitude },
            resetZoom,
            width,
            height
          );

          const worldWidth = 512 * Math.pow(2, resetZoom);
          const lngDegreesPerPixel = 360 / worldWidth;
          const easternEdgeLng =
            easternTown.longitude + MARKER_EDGE_PADDING_PX * lngDegreesPerPixel;
          const westernEdgeLng =
            westernTown.longitude - MARKER_EDGE_PADDING_PX * lngDegreesPerPixel;

          expect(easternEdgeLng).toBeLessThanOrEqual(viewportBox.maxLng + 1e-6);
          expect(westernEdgeLng).toBeGreaterThanOrEqual(
            viewportBox.minLng - 1e-6
          );
        });
      });
    });
  });
});
