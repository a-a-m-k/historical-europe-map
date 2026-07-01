import { describe, expect, it, vi } from "vitest";

import { createChannel, createVoidChannel } from "@/utils/events/eventBus";

describe("eventBus", () => {
  it("dispatches void events to subscribers", () => {
    const channel = createVoidChannel();
    const listener = vi.fn();
    const cleanup = channel.subscribe(listener);

    channel.dispatch();
    expect(listener).toHaveBeenCalledTimes(1);

    cleanup();
    channel.dispatch();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("dispatches typed detail to subscribers", () => {
    const channel = createChannel<{ value: number }>();
    const listener = vi.fn();
    const cleanup = channel.subscribe(listener);

    channel.dispatch({ value: 42 });
    expect(listener).toHaveBeenCalledWith({ value: 42 });

    cleanup();
  });

  it("unsubscribes when AbortSignal aborts", () => {
    const channel = createVoidChannel();
    const listener = vi.fn();
    const controller = new AbortController();

    channel.subscribe(listener, { signal: controller.signal });
    controller.abort();

    channel.dispatch();
    expect(listener).not.toHaveBeenCalled();
  });
});
