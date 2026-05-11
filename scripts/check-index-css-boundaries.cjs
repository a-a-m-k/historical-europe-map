const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const indexCssPath = join(process.cwd(), "src", "index.css");

const allowedSelectors = new Set([
  ":root",
  "html",
  "body",
  "#root",
  "a",
  "a:hover",
  'body[data-narrow-layout="true"] #legend',
  'body[data-narrow-layout="true"] #timeline',
  ".sr-only",
  "*:focus-visible",
  "a:focus-visible",
  ".map-view-shell",
  ".map-style-switch-overlay",
  ".map-dark-basemap-wrapper",
  ".town-marker-container",
  ".town-marker-container--focused",
  ".town-marker-hit-target",
  ".town-marker-hit-target--focused",
  ".town-marker-dot",
  ".town-marker-label-container",
  ".town-marker-label-content",
  ".town-marker-label-content--dark",
  ".town-marker-label-population",
]);

function extractSelectors(cssContent) {
  const withoutComments = cssContent.replace(/\/\*[\s\S]*?\*\//g, "");
  const selectors = new Set();
  const blockPattern = /([^{}]+)\{/g;
  let match;

  while ((match = blockPattern.exec(withoutComments)) !== null) {
    const group = match[1].trim();
    if (!group || group.startsWith("@")) continue;

    const parts = group
      .split(",")
      .map(part => part.trim())
      .filter(Boolean);

    for (const selector of parts) selectors.add(selector);
  }

  return selectors;
}

const css = readFileSync(indexCssPath, "utf8");
const selectors = extractSelectors(css);
const unexpectedSelectors = [...selectors]
  .filter(selector => !allowedSelectors.has(selector))
  .sort();

if (unexpectedSelectors.length > 0) {
  console.error("[check-index-css-boundaries] Unexpected selector(s) in src/index.css:");
  for (const selector of unexpectedSelectors) {
    console.error(`  - ${selector}`);
  }
  console.error("");
  console.error(
    "index.css is restricted to global reset/accessibility + approved shared selectors."
  );
  console.error(
    "Move new layout/component rules into themed styles (e.g. src/theme/*) or component-level styles."
  );
  console.error(
    "If a selector must be global, update scripts/check-index-css-boundaries.cjs allowlist intentionally."
  );
  process.exit(1);
}

console.log("[check-index-css-boundaries] OK");
