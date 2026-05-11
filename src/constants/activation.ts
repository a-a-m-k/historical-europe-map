export const MAP_ACTIVATION_DELAY_MS = 1_500;
export const MAP_ACTIVATION_INTERACTION_EVENTS: Array<keyof WindowEventMap> = [
  "pointerdown",
  "keydown",
  "touchstart",
  "wheel",
];
