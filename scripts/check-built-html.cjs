#!/usr/bin/env node
/* eslint-disable no-console */
const { existsSync, readFileSync } = require("fs");
const { join } = require("path");

const distIndexPath = join(process.cwd(), "dist", "index.html");

function getExpectedBasePath() {
  const fromEnv = process.env.VITE_BASE_PATH;
  if (fromEnv && fromEnv.trim()) {
    const base = fromEnv.trim();
    return base.endsWith("/") ? base : `${base}/`;
  }
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8"));
    const homepage = pkg.homepage;
    if (typeof homepage === "string" && homepage.trim().length > 0) {
      const url = new URL(homepage);
      const pathname = url.pathname.replace(/\/$/, "");
      return pathname ? `${pathname}/` : "/";
    }
  } catch (_error) {
    // Fall back to root.
  }
  return "/";
}

const expectedBasePath = getExpectedBasePath();
const escapedBasePath = expectedBasePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

if (!existsSync(distIndexPath)) {
  console.error("[check-built-html] dist/index.html not found. Run build first.");
  process.exit(1);
}

const html = readFileSync(distIndexPath, "utf-8");
let failed = false;

const entryScriptMatch = html.match(
  new RegExp(
    `<script[^>]+type="module"[^>]+src="(${escapedBasePath}assets/index-[^"]+\\.js)"`
  )
);
if (!entryScriptMatch) {
  console.error(
    `[check-built-html] Missing expected module entry script under ${expectedBasePath}assets/index-*.js.`
  );
  failed = true;
}

const entryPreloadMatch = html.match(
  new RegExp(
    `<link[^>]+rel="modulepreload"[^>]+href="(${escapedBasePath}assets/index-[^"]+\\.js)"`
  )
);
if (!entryPreloadMatch) {
  console.error(
    `[check-built-html] Missing modulepreload hint for ${expectedBasePath}assets/index-*.js.`
  );
  failed = true;
}

if (entryScriptMatch && entryPreloadMatch) {
  const scriptHref = entryScriptMatch[1];
  const preloadHref = entryPreloadMatch[1];
  if (scriptHref !== preloadHref) {
    console.error(
      `[check-built-html] Entry script (${scriptHref}) and preload (${preloadHref}) do not match.`
    );
    failed = true;
  }
}

const duplicatePreloads = [...html.matchAll(/rel="modulepreload" href="([^"]+)"/g)]
  .map(match => match[1])
  .filter((href, idx, all) => all.indexOf(href) !== idx);
if (duplicatePreloads.length > 0) {
  console.error(
    `[check-built-html] Duplicate modulepreload hrefs found: ${[
      ...new Set(duplicatePreloads),
    ].join(", ")}`
  );
  failed = true;
}

const absoluteAssetUrls = [...html.matchAll(/\b(?:href|src)="(\/[^"]+)"/g)]
  .map(match => match[1])
  .filter(url => url.startsWith("/assets/"));
if (absoluteAssetUrls.length > 0) {
  console.error(
    `[check-built-html] Found non-prefixed absolute asset URLs: ${absoluteAssetUrls.join(", ")}`
  );
  failed = true;
}

const criticalCssTagCount = (html.match(/id="critical-css"/g) || []).length;
if (criticalCssTagCount > 1) {
  console.error(
    `[check-built-html] Found duplicate critical CSS tags: ${criticalCssTagCount}.`
  );
  failed = true;
}

if (!failed) {
  console.log("[check-built-html] OK");
}

process.exit(failed ? 1 : 0);

