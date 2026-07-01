import React from "react";
import Box from "@mui/material/Box";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { SPACING, fullscreenErrorScrimSx } from "@/constants/ui";

interface ErrorOverlayProps {
  title: string;
  message: string;
  onRetry?: () => void;
}

/**
 * Full-screen overlay with an error alert and retry action.
 * Used for towns bundle load errors and year-scoped data errors in the map container.
 */
export const ErrorOverlay: React.FC<ErrorOverlayProps> = ({
  title,
  message,
  onRetry,
}) => (
  <Box
    sx={{
      ...fullscreenErrorScrimSx,
      padding: SPACING.LG,
    }}
  >
    <Box sx={{ width: "90%", maxWidth: 600, position: "relative" }}>
      <ErrorAlert title={title} message={message} onRetry={onRetry} />
    </Box>
  </Box>
);
