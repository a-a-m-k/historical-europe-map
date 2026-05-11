import IconButton from "@mui/material/IconButton";
import { styled } from "@mui/material/styles";

import {
  mapOverlayIconButtonFloatingStyles,
  mapOverlayIconButtonInlineStyles,
  mapOverlayIconButtonRootStyles,
} from "@/theme/mapOverlayIconButtonSharedStyles";
import { mapOverlayNavGroupIconButtonStyles } from "@/theme/mapOverlayNavGroupStyles";

export const MapResetViewControl = styled(IconButton, {
  shouldForwardProp: () => true,
})(({ theme }) => ({
  ...mapOverlayIconButtonRootStyles(theme),
  ...mapOverlayIconButtonFloatingStyles(theme, {
    floatingSvgIconExtras: { lineHeight: 1, display: "block" },
  }),
  ...mapOverlayNavGroupIconButtonStyles(theme),
  ...mapOverlayIconButtonInlineStyles(theme),
}));
