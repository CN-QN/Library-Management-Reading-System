"use client";

import { useCallback, useEffect, useState } from "react";

interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

/**
 * Runs `fetcher` on mount and re-runs it whenever the `fetcher`
 * reference changes or `retry()` is called. Wrap `fetcher` in
 * useCallback at the call site if it captures reactive values
 * (e.g. a page number) so it only changes when those values do.
 */
export function useAsync<T>(fetcher: () => Promise<T>) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: true,
  });
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // Yield a tick before flipping back to "loading" so this reset
      // itself isn't a synchronous setState-in-effect.
      await Promise.resolve();
      if (cancelled) return;
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await fetcher();
        if (!cancelled) setState({ data, error: null, isLoading: false });
      } catch (err) {
        if (!cancelled) setState({ data: null, error: err as Error, isLoading: false });
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [fetcher, retryToken]);

  const retry = useCallback(() => setRetryToken((t) => t + 1), []);

  return { ...state, retry };
}
