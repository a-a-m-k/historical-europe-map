#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getLatestRunDir(baseDir) {
  const entries = fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(baseDir, entry.name));

  if (entries.length === 0) return null;

  entries.sort((a, b) => {
    const aMtime = fs.statSync(a).mtimeMs;
    const bMtime = fs.statSync(b).mtimeMs;
    return bMtime - aMtime;
  });

  return entries[0];
}

const profile = process.env.COVERAGE_PROFILE || "ci";
const runId = process.env.COVERAGE_RUN_ID || "";
const artifactRoot = process.env.COVERAGE_ARTIFACT_ROOT || ".artifacts/coverage";
const baselinePath = path.resolve(process.cwd(), "config/coverage-ratchet.json");
const profileDir = path.resolve(process.cwd(), artifactRoot, profile);
const runDir = runId
  ? path.join(profileDir, runId)
  : getLatestRunDir(profileDir);

if (!fs.existsSync(baselinePath)) {
  console.error(`[coverage-ratchet] Missing baseline file: ${baselinePath}`);
  process.exit(1);
}
if (!runDir) {
  console.error(`[coverage-ratchet] No coverage run directory found under: ${profileDir}`);
  process.exit(1);
}

const summaryPath = path.join(runDir, "coverage-summary.json");
if (!fs.existsSync(summaryPath)) {
  console.error(`[coverage-ratchet] Missing coverage summary: ${summaryPath}`);
  process.exit(1);
}

const baseline = readJson(baselinePath);
const summary = readJson(summaryPath);
const current = {
  statements: summary.total.statements.pct,
  branches: summary.total.branches.pct,
  functions: summary.total.functions.pct,
  lines: summary.total.lines.pct,
};

const failures = Object.entries(baseline)
  .filter(([key, min]) => current[key] < min)
  .map(
    ([key, min]) =>
      `${key}: current ${current[key].toFixed(2)} < baseline ${Number(min).toFixed(2)}`
  );

if (failures.length > 0) {
  console.error("[coverage-ratchet] Baseline regression detected:");
  failures.forEach(line => console.error(`  - ${line}`));
  process.exit(1);
}

console.log("[coverage-ratchet] OK");
console.log(
  `[coverage-ratchet] statements ${current.statements.toFixed(2)}, branches ${current.branches.toFixed(
    2
  )}, functions ${current.functions.toFixed(2)}, lines ${current.lines.toFixed(2)}`
);
