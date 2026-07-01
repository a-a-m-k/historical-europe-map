import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";

import { useLegendContentStyles } from "@/components/legend/useLegendLayout";
import theme from "@/theme/theme";

describe("useLegendContentStyles", () => {
  it("centers population classes in a marker grid on mobile", () => {
    const { result } = renderHook(() =>
      useLegendContentStyles(theme, {
        isMobileLayout: true,
        isTabletLayout: false,
      })
    );
    const { layoutMode, sx } = result.current.stackStyles;

    expect(layoutMode).toBe("grid");
    expect(sx.display).toBe("grid");
    expect(sx.gridTemplateColumns).toBe("auto auto");
    expect(sx.justifyContent).toBe("center");
    expect(sx.justifyItems).toBe("start");
    expect(sx.width).toBe("100%");
  });

  it("uses wrapped centered chips on tablet", () => {
    const { result } = renderHook(() =>
      useLegendContentStyles(theme, {
        isMobileLayout: false,
        isTabletLayout: true,
      })
    );
    const { layoutMode, sx } = result.current.stackStyles;

    expect(layoutMode).toBe("chips");
    expect(sx.flexDirection).toBe("row");
    expect(sx.alignItems).toBe("center");
    expect(sx.justifyContent).toBe("center");
    expect(sx.flexWrap).toBe("wrap");
    expect(sx.alignContent).toBe("center");
    expect(sx.overflowX).toBe("visible");
    expect(sx.gap).toBe(theme.spacing(1));
  });

  it("centers population classes in a marker grid on desktop", () => {
    const { result } = renderHook(() =>
      useLegendContentStyles(theme, {
        isMobileLayout: false,
        isTabletLayout: false,
      })
    );
    const { stackStyles, titleStyle, listBlockStyles } = result.current;
    const { layoutMode, sx } = stackStyles;

    expect(layoutMode).toBe("grid");
    expect(sx.display).toBe("grid");
    expect(sx.gridTemplateColumns).toBe(`${theme.spacing(2.5)} auto`);
    expect(sx.justifyContent).toBe("start");
    expect(sx.justifyItems).toBe("start");
    expect(titleStyle.textAlign).toBe("left");
    expect(listBlockStyles?.outer).toMatchObject({
      display: "flex",
      justifyContent: "center",
    });
    expect(listBlockStyles?.inner).toMatchObject({
      alignItems: "flex-start",
    });
  });

  it.each([
    { label: "mobile", isMobileLayout: true, isTabletLayout: false },
    { label: "tablet", isMobileLayout: false, isTabletLayout: true },
    { label: "desktop", isMobileLayout: false, isTabletLayout: false },
  ])(
    "keeps the app title on one line on $label",
    ({ isMobileLayout, isTabletLayout }) => {
      const { result } = renderHook(() =>
        useLegendContentStyles(theme, { isMobileLayout, isTabletLayout })
      );

      expect(result.current.appTitleStyle.whiteSpace).toBe("nowrap");
    }
  );
});
