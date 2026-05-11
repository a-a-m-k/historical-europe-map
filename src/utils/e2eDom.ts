export function isE2ePlaywrightDom(): boolean {
  return (
    typeof document !== "undefined" &&
    document.documentElement.dataset.e2e === "1"
  );
}
