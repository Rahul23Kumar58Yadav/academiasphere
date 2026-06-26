// hooks/useApi.js
import { useState, useEffect, useCallback, useRef } from "react";

/**
 * useApi — generic data-fetching hook
 *
 * @param {Function} fetchFn   — async function that returns data
 * @param {any[]}    deps      — dependency array (re-fetch when changed)
 * @param {Object}   options
 *   @param {boolean} options.immediate       — fetch on mount (default true)
 *   @param {number}  options.pollInterval    — ms between auto-refreshes (0 = off)
 *   @param {any}     options.initialData     — value before first fetch
 */
export function useApi(fetchFn, deps = [], options = {}) {
  const {
    immediate = true,
    pollInterval = 0,
    initialData = null,
  } = options;

  const [data,    setData   ] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error,   setError  ] = useState(null);
  const mountedRef = useRef(true);
  const timerRef   = useRef(null);

  const execute = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      if (mountedRef.current) setData(result);
    } catch (err) {
      if (mountedRef.current) setError(err.message || "Something went wrong");
    } finally {
      if (mountedRef.current && !silent) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) execute();

    if (pollInterval > 0) {
      timerRef.current = setInterval(() => execute(true), pollInterval);
    }
    return () => {
      mountedRef.current = false;
      clearInterval(timerRef.current);
    };
  }, [execute, immediate, pollInterval]);

  return { data, loading, error, refetch: execute };
}