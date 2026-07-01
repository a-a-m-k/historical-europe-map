import React, { Suspense } from "react";
import Box from "@mui/material/Box";

import { MapResetViewButton } from "@/components/controls/MapResetViewButton/MapResetViewButton";
import { MapStyleToggle } from "@/components/map";
import { LegendCollapseButton } from "./LegendCollapseButton";
import type { LegendCollapseButtonProps } from "./LegendCollapseButton";

const ScreenshotButtonLazy = React.lazy(
  () => import("@/components/controls/ScreenshotButton/ScreenshotButton")
);

export interface LegendHeaderControlsProps extends LegendCollapseButtonProps {
  showTabletActions: boolean;
}

export const LegendHeaderControls: React.FC<LegendHeaderControlsProps> = ({
  showTabletActions,
  ...collapseProps
}) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 0.5,
      flexShrink: 0,
      flexWrap: "nowrap",
    }}
  >
    {showTabletActions && (
      <>
        <Suspense fallback={null}>
          <ScreenshotButtonLazy variant="inline" />
        </Suspense>
        <MapResetViewButton variant="inline" />
        <MapStyleToggle variant="inline" />
      </>
    )}
    <LegendCollapseButton {...collapseProps} />
  </Box>
);
