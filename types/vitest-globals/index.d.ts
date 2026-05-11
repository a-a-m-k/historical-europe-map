import type * as Vitest from "vitest";

declare global {
  const describe: typeof Vitest.describe;
  const it: typeof Vitest.it;
  const test: typeof Vitest.test;
  const expect: typeof Vitest.expect;
  const beforeEach: typeof Vitest.beforeEach;
  const afterEach: typeof Vitest.afterEach;
  const beforeAll: typeof Vitest.beforeAll;
  const afterAll: typeof Vitest.afterAll;
  const vi: typeof Vitest.vi;
}

export {};
