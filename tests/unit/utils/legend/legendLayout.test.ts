import { describe, expect, it } from "vitest";

import { LEGEND_WIDTHS } from "@/constants";
import theme from "@/theme/theme";
import { getResponsiveStyles } from "@/utils/legend";

describe("getResponsiveStyles", () => {
  const commonStyles = { zIndex: 1 };

  it("desktop legend enforces min width for single-line header copy", () => {
    const styles = getResponsiveStyles({
      isMobile: false,
      isTablet: false,
      isXLarge: false,
      theme,
      commonStyles,
    });

    expect(styles).toMatchObject({
      position: "absolute",
      minWidth: LEGEND_WIDTHS.DESKTOP_MIN,
      maxWidth: LEGEND_WIDTHS.DESKTOP_MAX,
      width: LEGEND_WIDTHS.DESKTOP,
    });
    expect(LEGEND_WIDTHS.DESKTOP_MIN).toBe("300px");
  });

  it("mobile and tablet legends span the overlay width", () => {
    const mobile = getResponsiveStyles({
      isMobile: true,
      isTablet: false,
      isXLarge: false,
      theme,
      commonStyles,
    });
    const tablet = getResponsiveStyles({
      isMobile: false,
      isTablet: true,
      isXLarge: false,
      theme,
      commonStyles,
    });

    expect(mobile).toMatchObject({ position: "fixed", left: expect.any(String) });
    expect(tablet).toMatchObject({ position: "fixed", left: expect.any(String) });
    expect(mobile).not.toHaveProperty("minWidth", LEGEND_WIDTHS.DESKTOP_MIN);
  });
});
