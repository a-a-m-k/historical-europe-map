type Unsubscribe = () => void;

export type SubscribeOptions = {
  signal?: AbortSignal;
};

const bindAbort = (
  unsubscribe: Unsubscribe,
  signal?: AbortSignal
): Unsubscribe => {
  if (!signal) return unsubscribe;
  if (signal.aborted) {
    unsubscribe();
    return unsubscribe;
  }
  signal.addEventListener("abort", unsubscribe, { once: true });
  return unsubscribe;
};

/** In-process pub/sub channel with no payload. */
export const createVoidChannel = () => {
  const listeners = new Set<() => void>();

  const dispatch = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const subscribe = (
    listener: () => void,
    options?: SubscribeOptions
  ): Unsubscribe => {
    listeners.add(listener);
    return bindAbort(() => {
      listeners.delete(listener);
    }, options?.signal);
  };

  return { dispatch, subscribe };
};

/** In-process typed pub/sub channel. */
export const createChannel = <TDetail>() => {
  const listeners = new Set<(detail: TDetail) => void>();

  const dispatch = (detail: TDetail) => {
    for (const listener of listeners) {
      listener(detail);
    }
  };

  const subscribe = (
    listener: (detail: TDetail) => void,
    options?: SubscribeOptions
  ): Unsubscribe => {
    listeners.add(listener);
    return bindAbort(() => {
      listeners.delete(listener);
    }, options?.signal);
  };

  return { dispatch, subscribe };
};
