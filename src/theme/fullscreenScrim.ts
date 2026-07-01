import { Z_INDEX } from "@/theme/themeValues";

/**
 * Dimmed fullscreen backdrop + light blur shared by blocking error UIs
 * (`ErrorOverlay`, `ErrorFallback`). Merge with layout-specific `sx` (padding, flexDirection, etc.).
 */
export const fullscreenErrorScrimSx = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: Z_INDEX.ERROR,
  display: "flex" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  backdropFilter: "blur(4px)",
};
