import type { ErrorInfo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import ErrorIcon from "@mui/icons-material/Error";
import { Button } from "@/components/ui/common";
import { SPACING, TRANSITIONS, fullscreenErrorScrimSx } from "@/constants";
import { strings } from "@/locales";
import { getUserFacingMessage } from "@/utils/errorMessage";

export interface ErrorFallbackProps {
  error?: Error;
  errorInfo?: ErrorInfo;
  onReload: () => void;
  onReset: () => void;
}

export function ErrorFallback({
  error,
  errorInfo,
  onReload,
  onReset,
}: ErrorFallbackProps) {
  return (
    <Box
      sx={{
        ...fullscreenErrorScrimSx,
        flexDirection: "column",
        padding: SPACING.XL,
        textAlign: "center",
        transition: TRANSITIONS.NORMAL,
      }}
    >
      <Alert
        severity="error"
        icon={<ErrorIcon />}
        sx={{ mb: SPACING.XL, maxWidth: 600, width: "90%" }}
      >
        <AlertTitle>{strings.errors.somethingWentWrong}</AlertTitle>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {getUserFacingMessage(error, strings.errors.unexpectedError)}
        </Typography>

        {import.meta.env.DEV && error && (
          <Box
            sx={{
              mt: SPACING.LG,
              p: SPACING.LG,
              bgcolor: "grey.100",
              borderRadius: 1,
            }}
          >
            <Typography
              variant="caption"
              component="pre"
              sx={{
                fontFamily: "monospace",
                fontSize: "0.75rem",
                textAlign: "left",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {error.toString()}
              {errorInfo && (
                <>
                  {"\n\n"}
                  Component Stack:
                  {errorInfo.componentStack}
                </>
              )}
            </Typography>
          </Box>
        )}
      </Alert>

      <Box sx={{ display: "flex", gap: SPACING.LG }}>
        <Button
          variant="contained"
          color="primary"
          onClick={onReset}
          aria-label={strings.errors.tryAgainReset}
        >
          {strings.common.reset}
        </Button>
        <Button
          variant="outlined"
          onClick={onReload}
          aria-label={strings.errors.reloadPageRecover}
        >
          {strings.common.reloadPage}
        </Button>
      </Box>

      {import.meta.env.DEV && (
        <Typography
          variant="caption"
          sx={{ mt: SPACING.LG, color: "text.secondary" }}
        >
          💡 {strings.dev.checkConsole}
        </Typography>
      )}
    </Box>
  );
}
