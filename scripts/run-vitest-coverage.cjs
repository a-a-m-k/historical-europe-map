#!/usr/bin/env node
const { spawnSync } = require("node:child_process");

const args = process.argv.slice(2);
const isCiReporter = args.includes("--ci-reporter");
const shouldCheckRatchet = args.includes("--ratchet");
const profileArg = args.find(arg => arg.startsWith("--profile="));
const profile = profileArg ? profileArg.split("=")[1] : "local";

const runId = `${Date.now()}-${process.pid}`;
const vitestArgs = ["vitest", "run", "--coverage"];
if (isCiReporter) vitestArgs.push("--reporter=dot");

const result = spawnSync("npx", vitestArgs, {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    NODE_OPTIONS: "--max-old-space-size=4096",
    COVERAGE_PROFILE: profile,
    COVERAGE_RUN_ID: runId,
  },
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

if ((result.status ?? 1) !== 0) {
  process.exit(result.status ?? 1);
}

if (shouldCheckRatchet) {
  const ratchet = spawnSync("node", ["scripts/check-coverage-ratchet.cjs"], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      COVERAGE_PROFILE: profile,
      COVERAGE_RUN_ID: runId,
    },
  });

  if (ratchet.error) {
    console.error(ratchet.error);
    process.exit(1);
  }

  process.exit(ratchet.status ?? 1);
}

process.exit(0);
