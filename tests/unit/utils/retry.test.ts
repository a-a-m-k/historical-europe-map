import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { retryWithBackoff } from "@/utils/retry";

describe("retryWithBackoff", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns on first success without waiting", async () => {
    const fn = vi.fn().mockResolvedValue("ok");

    await expect(retryWithBackoff(fn)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries with backoff and succeeds later", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail-1"))
      .mockRejectedValueOnce(new Error("fail-2"))
      .mockResolvedValue("ok");

    const promise = retryWithBackoff(fn, {
      initialDelay: 10,
      backoffMultiplier: 2,
      maxDelay: 100,
      maxAttempts: 4,
    });

    await vi.advanceTimersByTimeAsync(10);
    await vi.advanceTimersByTimeAsync(20);

    await expect(promise).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws final error after max attempts", async () => {
    const err = new Error("always-fails");
    const fn = vi.fn().mockRejectedValue(err);

    const promise = retryWithBackoff(fn, {
      maxAttempts: 3,
      initialDelay: 5,
      backoffMultiplier: 3,
      maxDelay: 100,
    });

    const rejection = expect(promise).rejects.toThrow("always-fails");
    await vi.runAllTimersAsync();
    await rejection;
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
