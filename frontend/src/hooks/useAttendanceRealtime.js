// hooks/useAttendanceRealtime.js
// Provides real-time attendance updates via:
//  1. SSE  (Server-Sent Events) if your Express server supports it
//  2. Falls back to polling every POLL_MS milliseconds
//
// Usage:
//   const { data, refetch } = useAttendanceRealtime(fetcher, deps, options)

import { useState, useEffect, useRef, useCallback } from "react";

const POLL_MS = 15_000; // poll every 15 s when SSE not available

/**
 * @param {() => Promise<any>} fetcher  - async function that fetches fresh data
 * @param {any[]}              deps     - re-subscribe when these change
 * @param {{ pollMs?: number, sseUrl?: string }} options
 */
export function useAttendanceRealtime(fetcher, deps = [], options = {}) {
  const { pollMs = POLL_MS, sseUrl } = options;

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const timerRef  = useRef(null);
  const esRef     = useRef(null);
  const mountedRef= useRef(true);

  const load = useCallback(async () => {
    try {
      setError(null);
      const result = await fetcher();
      if (mountedRef.current) {
        setData(result?.data ?? result);
        setLoading(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message);
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    load();

    // ── Try SSE first ────────────────────────────────────────────────────────
    if (sseUrl && typeof EventSource !== "undefined") {
      const token = localStorage.getItem("token");
      const url   = token ? `${sseUrl}?token=${token}` : sseUrl;
      const es    = new EventSource(url);
      esRef.current = es;

      es.addEventListener("attendance-update", () => load());
      es.onerror = () => {
        es.close();
        // Fall back to polling
        timerRef.current = setInterval(load, pollMs);
      };
    } else {
      // ── Polling fallback ─────────────────────────────────────────────────
      timerRef.current = setInterval(load, pollMs);
    }

    return () => {
      mountedRef.current = false;
      clearInterval(timerRef.current);
      esRef.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  return { data, loading, error, refetch: load };
}

// ─── Tiny event bus ────────────────────────────────────────────────────────────
// Components call  attendanceBus.emit()  after saving attendance.
// Siblings call    attendanceBus.on()    to react instantly (same tab).

const listeners = new Set();

export const attendanceBus = {
  emit(detail = {}) {
    listeners.forEach((fn) => fn(detail));
    // Also update other tabs via BroadcastChannel when supported
    try {
      new BroadcastChannel("attendance").postMessage(detail);
    } catch (_) {}
  },
  on(fn) {
    listeners.add(fn);
    // Cross-tab
    let bc;
    try {
      bc = new BroadcastChannel("attendance");
      bc.onmessage = (e) => fn(e.data);
    } catch (_) {}
    return () => {
      listeners.delete(fn);
      bc?.close();
    };
  },
};