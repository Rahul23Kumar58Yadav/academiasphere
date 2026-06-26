// src/hooks/useSchoolEvents.js
// Replace the entire file with this:
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";

const API_BASE =
  (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api/v1";

const cache     = new Map();
const CACHE_TTL = 30_000;
const POLL_MS   = 60_000;
const FAST_POLL = 10_000;

let bc = null;
try { bc = new BroadcastChannel("school_events"); } catch {}

const subscribers = new Set();
function notifyAll() { subscribers.forEach((fn) => fn()); }

export function useSchoolEvents(days = 30, month = null) {
  const { authFetch, isAuthenticated } = useAuth();

  // ── Stable ref to authFetch so it never causes effect re-runs ────────────
  const authFetchRef = useRef(authFetch);
  useEffect(() => { authFetchRef.current = authFetch; }, [authFetch]);

  const key = month ? `month:${month}` : `days:${days}`;

  const [events,      setEvents]      = useState(() => cache.get(key)?.events ?? []);
  const [loading,     setLoading]     = useState(() => !cache.has(key));
  const [error,       setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(() => cache.get(key)?.fetchedAt ?? null);
  const [tick,        setTick]        = useState(0);

  const abortRef   = useRef(null);
  const pollTimer  = useRef(null);
  const fastTimer  = useRef(null);
  const errorCount = useRef(0);
  const isMounted  = useRef(true);

  const doFetch = useCallback(async (force = false) => {
    if (!isMounted.current || !isAuthenticated) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const cached = cache.get(key);
    if (!force && cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
      setEvents(cached.events);
      setLastUpdated(cached.fetchedAt);
      setLoading(false);
      return;
    }

    setLoading(true);

    const url = month
      ? `/calendar?month=${month.split("-")[1]}&year=${month.split("-")[0]}&limit=200`
      : `/calendar/upcoming?days=${days}`;

    try {
      // Use the ref so we always have the latest authFetch without it being
      // a dependency that causes infinite re-runs
      const res = await authFetchRef.current(url, { signal: ctrl.signal });

      if (!res) return; // auth failed → user redirected by AuthContext

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "API error");

      const evs = data.events ?? [];
      const now = Date.now();
      cache.set(key, { events: evs, fetchedAt: now });
      errorCount.current = 0;

      if (isMounted.current && !ctrl.signal.aborted) {
        setEvents(evs);
        setError(null);
        setLastUpdated(now);
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      errorCount.current++;
      console.warn("[useSchoolEvents]", err.message);
      if (isMounted.current && !ctrl.signal.aborted) {
        setError(err.message);
        if (!cache.has(key)) setEvents([]);
      }
    } finally {
      if (isMounted.current && !ctrl.signal.aborted) setLoading(false);
    }
  // key/days/month are stable primitives; isAuthenticated is boolean
  // authFetch is accessed via ref — NOT in deps to avoid infinite loops
  }, [key, days, month, isAuthenticated]); // eslint-disable-line

  // ── Polling ────────────────────────────────────────────────────────────────
  const schedulePoll = useCallback(() => {
    clearTimeout(pollTimer.current);
    const backoff = Math.min(POLL_MS * 2 ** Math.min(errorCount.current, 4), 300_000);
    pollTimer.current = setTimeout(() => {
      if (document.visibilityState !== "hidden") {
        doFetch(true).finally(schedulePoll);
      } else {
        schedulePoll();
      }
    }, backoff);
  }, [doFetch]);

  // ── Visibility: re-fetch when tab becomes active ───────────────────────────
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const cached = cache.get(key);
      if (!cached || Date.now() - cached.fetchedAt > CACHE_TTL) {
        doFetch(true).finally(schedulePoll);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [doFetch, schedulePoll, key]);

  // ── BroadcastChannel: admin mutated events in another tab ─────────────────
  useEffect(() => {
    if (!bc) return;
    const handler = (e) => {
      if (e.data?.type === "EVENTS_MUTATED") {
        cache.delete(key);
        doFetch(true);
      }
    };
    bc.addEventListener("message", handler);
    return () => bc.removeEventListener("message", handler);
  }, [doFetch, key]);

  // ── Same-tab cross-hook invalidation ──────────────────────────────────────
  useEffect(() => {
    const handler = () => { cache.delete(key); doFetch(true); };
    subscribers.add(handler);
    return () => subscribers.delete(handler);
  }, [doFetch, key]);

  // ── Initial fetch + poll start ─────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;
    if (isAuthenticated) {
      doFetch(tick > 0).finally(schedulePoll);
    }
    return () => {
      isMounted.current = false;
      abortRef.current?.abort();
      clearTimeout(pollTimer.current);
      clearTimeout(fastTimer.current);
    };
  }, [tick, isAuthenticated, doFetch, schedulePoll]);

  // ── Public refetch ─────────────────────────────────────────────────────────
  const refetch = useCallback(() => {
    cache.delete(key);
    notifyAll();
    bc?.postMessage({ type: "EVENTS_MUTATED" });

    clearTimeout(fastTimer.current);
    let count = 0;
    const fast = () => {
      if (count++ >= 6) return;
      fastTimer.current = setTimeout(() => doFetch(true).finally(fast), FAST_POLL);
    };
    fast();
    setTick((t) => t + 1);
  }, [key, doFetch]);

  return { events, loading, error, lastUpdated, refetch };
}




export function broadcastEventMutation() {
  cache.clear();
  notifyAll();
  bc?.postMessage({ type: "EVENTS_MUTATED" });
}