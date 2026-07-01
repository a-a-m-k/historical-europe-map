import React from "react";

/**
 * Test helper component for E2E ErrorBoundary testing.
 * Active only in development mode; use ?testError=true to trigger an intentional throw.
 */
export const ErrorTestHelper: React.FC = () => {
  if (!import.meta.env.DEV) {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const shouldThrow = params.get("testError") === "true";

  if (shouldThrow) {
    throw new Error("Test error for ErrorBoundary E2E testing");
  }

  return null;
};
