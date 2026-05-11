import { describe, expect, it } from "vitest";

import {
  calculateMarkerColor,
  calculateMarkerColorFromPopulation,
  calculateMarkerDiameter,
  calculateMarkerRadius,
  calculateMarkerRadiusFromPopulation,
  disableTownMarkerFocus,
  enableTownMarkerFocus,
  generateTownMarkerAriaLabel,
  getDefaultMarkerScaleConfig,
  getMarkerColorStops,
  getMarkerScaleBounds,
  getMarkerScaleConfigForMapMode,
  getStableTownMarkerId,
} from "@/utils/markers";

describe("marker utilities", () => {
  it("produces stable marker ids with rounded coordinates", () => {
    const id = getStableTownMarkerId({
      name: "Paris",
      latitude: 48.856613,
      longitude: 2.352222,
      populationByYear: {},
    });
    expect(id).toBe("Paris-48.8566-2.3522");
  });

  it("builds aria labels with population and aliases", () => {
    const label = generateTownMarkerAriaLabel(
      {
        name: "Constantinople",
        latitude: 41.0082,
        longitude: 28.9784,
        populationByYear: { 1200: 450000 },
        nameVariants: ["Konstantiniyye", "Byzantion"],
      },
      1200
    );

    expect(label).toContain("Constantinople");
    expect(label).toContain("450,000");
    expect(label).toContain("Also known as: Konstantiniyye, Byzantion");
  });

  it("toggles focusability helpers", () => {
    const element = document.createElement("button");
    disableTownMarkerFocus(element);
    expect(element.tabIndex).toBe(-1);
    enableTownMarkerFocus(element);
    expect(element.tabIndex).toBe(0);
  });

  it("computes scale bounds and color stops from default config", () => {
    const config = getDefaultMarkerScaleConfig();
    const bounds = getMarkerScaleBounds(config);
    const stops = getMarkerColorStops(config);

    expect(bounds.minPopulation).toBe(config.populationThresholds[0]);
    expect(bounds.maxPopulation).toBe(
      config.populationThresholds[config.populationThresholds.length - 1]
    );
    expect(stops.length).toBe(config.populationThresholds.length * 2);
  });

  it("applies map mode specific color ramps", () => {
    const light = getMarkerScaleConfigForMapMode("light");
    const dark = getMarkerScaleConfigForMapMode("dark");
    expect(dark.legendColors).not.toEqual(light.legendColors);
  });

  it("calculates marker radius with clamping and no-data handling", () => {
    const config = getDefaultMarkerScaleConfig();
    const noData = calculateMarkerRadiusFromPopulation(null, config);
    const low = calculateMarkerRadiusFromPopulation(1, config);
    const high = calculateMarkerRadiusFromPopulation(1_000_000, config);

    expect(noData).toBe(config.noDataMarkerSize);
    expect(low).toBeGreaterThanOrEqual(config.minMarkerSize);
    expect(high).toBeLessThanOrEqual(config.maxMarkerSize);
  });

  it("maps population to color with null and below-threshold handling", () => {
    const config = getDefaultMarkerScaleConfig();
    expect(calculateMarkerColorFromPopulation(null, config)).toBe(
      config.legendColors[0]
    );
    expect(calculateMarkerColorFromPopulation(1, config)).toBe(
      config.legendColors[1]
    );
  });

  it("keeps wrapper helpers aligned with scale model", () => {
    const radius = calculateMarkerRadius(50_000);
    const diameter = calculateMarkerDiameter(50_000);
    const colorLight = calculateMarkerColor(50_000, "light");
    const colorDark = calculateMarkerColor(50_000, "dark");

    expect(diameter).toBe(radius * 2);
    expect(typeof colorLight).toBe("string");
    expect(typeof colorDark).toBe("string");
    expect(colorDark).not.toEqual(colorLight);
  });
});
