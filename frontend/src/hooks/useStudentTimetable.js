// src/hooks/useStudentTimetable.js
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";

export function useStudentTimetable(month, year) {
  const { authFetch, isAuthenticated } = useAuth();

  const now = new Date();
  const m   = month ?? now.getMonth() + 1;
  const y   = year  ?? now.getFullYear();

  const [events,      setEvents]      = useState([]);
  const [byDay,       setByDay]       = useState({});  // { "Monday": [...], ... }
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ── Stable ref so authFetch never causes fetchSchedule to be recreated ──
  const authFetchRef = useRef(authFetch);
  useEffect(() => { authFetchRef.current = authFetch; }, [authFetch]);

  const pendingRef = useRef(false);
  const isMounted  = useRef(true);

  const DAY_NAMES = [
    "Sunday","Monday","Tuesday","Wednesday",
    "Thursday","Friday","Saturday",
  ];

  const fetchSchedule = useCallback(async () => {
    // ── Guard: don't fire while another request is in flight, or before
    //    auth is confirmed (mirrors useSchoolEvents pattern) ────────────────
    if (pendingRef.current || !isAuthenticated) return;

    pendingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const res = await authFetchRef.current(
        `/calendar/student/schedule?month=${m}&year=${y}`
      );
      if (!res) return; // auth redirect handled by AuthContext

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (isMounted.current) setError(body.message || `Server error (${res.status})`);
        return;
      }

      const data = await res.json();
      if (!data?.success || !Array.isArray(data.events)) {
        if (isMounted.current) setError("Unexpected response from server");
        return;
      }

      if (!isMounted.current) return;

      setEvents(data.events);
      setLastUpdated(Date.now());


      const grouped = {};
      for (const ev of data.events) {
        if (!ev.date) continue;
        const [yr, mo, dy] = ev.date.split("-").map(Number);
        const dayName = DAY_NAMES[new Date(yr, mo - 1, dy).getDay()];
        if (!grouped[dayName]) grouped[dayName] = [];
        grouped[dayName].push(ev);
      }
      // Sort each day's events by startTime
      for (const day of Object.keys(grouped)) {
        grouped[day].sort((a, b) =>
          (a.startTime || "").localeCompare(b.startTime || "")
        );
      }
      setByDay(grouped);
    } catch (err) {
      if (isMounted.current) setError("Network error — check your connection");
    } finally {
      if (isMounted.current) setLoading(false);
      pendingRef.current = false;
    }
  
  }, [m, y, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    isMounted.current = true;

    if (isAuthenticated) {
      fetchSchedule();
    }
    return () => {
      isMounted.current = false;
    };
  }, [fetchSchedule, isAuthenticated]);

  return { events, byDay, loading, error, lastUpdated, refetch: fetchSchedule };
}

export default useStudentTimetable;