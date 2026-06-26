// src/contexts/AuthContext.jsx
import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";

const ROLE_HOME = {
  SUPER_ADMIN:  "/super-admin/dashboard",
  SCHOOL_ADMIN: "/school-admin/dashboard",
  TEACHER:      "/teacher/dashboard",
  STUDENT:      "/student/dashboard",
  PARENT:       "/parent/dashboard",
  VENDOR:       "/vendor/dashboard",
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  const [user,             setUser]             = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [authLoading,      setAuthLoading]      = useState(false);
  const [error,            setError]            = useState(null);
  // FIX: null = unknown/loading, true/false = resolved
  const [superAdminExists, setSuperAdminExists] = useState(null);

  // FIX: use a ref so logout is always the latest version without
  //      causing authFetch to re-create on every render
  const logoutRef = useRef(null);

  // ── Silent token refresh ──────────────────────────────────────────────────
  const silentRefresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method:      "POST",
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  // ── Authenticated fetch with automatic 401 retry ──────────────────────────
  const authFetch = useCallback(async (url, options = {}) => {
    const fullUrl = url.startsWith("http")
      ? url
      : `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;

    let response = await fetch(fullUrl, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options.headers },
    });

    if (response.status === 401) {
      const refreshed = await silentRefresh();
      if (refreshed) {
        response = await fetch(fullUrl, {
          ...options,
          credentials: "include",
          headers: { "Content-Type": "application/json", ...options.headers },
        });
      } else {
        // FIX: call via ref so we always have the latest logout function
        logoutRef.current?.();
        return null;
      }
    }

    return response;
  }, [silentRefresh]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method:      "POST",
        credentials: "include",
      });
    } catch (_) {
      // non-fatal — clear state regardless
    }
    setUser(null);
    setError(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  // FIX: keep logoutRef current so authFetch always calls the latest logout
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  // ── Bootstrap: restore session once on mount ──────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        let res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });

        if (res.status === 401) {
          const refreshed = await silentRefresh();
          if (refreshed) {
            res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
          }
        }

        if (!cancelled) {
          if (res?.ok) {
            const data = await res.json();
            setUser(data.user || data);
          } else {
            setUser(null);
          }
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootstrap();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Check if super admin exists ───────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/auth/super-admin-exists`)
      .then(r => r.json())
      .then(d => setSuperAdminExists(d.exists ?? false))
      .catch(() => setSuperAdminExists(false));
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password, isSuperAdmin = false) => {
    setAuthLoading(true);
    setError(null);
    try {
      const endpoint = isSuperAdmin ? "/auth/super-admin/login" : "/auth/login";
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.message || "Invalid email or password";
        setError(msg);
        return { success: false, message: msg };
      }

      if (data.requires2FA) {
        return { success: false, requires2FA: true, tempToken: data.tempToken };
      }

      setUser(data.user);
      navigate(ROLE_HOME[data.user?.role] || "/", { replace: true });
      return { success: true, user: data.user };
    } catch {
      const msg = "Network error. Please check your connection.";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setAuthLoading(false);
    }
  }, [navigate]);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (payload) => {
    setAuthLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data.message || "Registration failed";
        setError(msg);
        return { success: false, message: msg };
      }

      setUser(data.user);
      navigate(ROLE_HOME[data.user?.role] || "/", { replace: true });
      return { success: true };
    } catch {
      const msg = "Network error. Please check your connection.";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setAuthLoading(false);
    }
  }, [navigate]);

  // ── Register School ───────────────────────────────────────────────────────
  const registerSchool = useCallback(async (payload) => {
    setAuthLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/schools/register`, {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data.message || "School registration failed";
        setError(msg);
        return { success: false, message: msg };
      }
      return { success: true, data };
    } catch {
      const msg = "Network error. Please check your connection.";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // ── Setup Super Admin ─────────────────────────────────────────────────────
  const setupSuperAdmin = useCallback(async (payload) => {
    setAuthLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/setup-super-admin`, {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data.message || "Setup failed";
        setError(msg);
        return { success: false, message: msg };
      }

      setUser(data.user);
      // FIX: update superAdminExists immediately so the SA tab disappears
      setSuperAdminExists(true);
      navigate(ROLE_HOME[data.user?.role] || "/", { replace: true });
      return { success: true };
    } catch {
      const msg = "Network error. Please check your connection.";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setAuthLoading(false);
    }
  }, [navigate]);

  // ── Update user in context (e.g. after profile edit) ─────────────────────
  const updateUser = useCallback((updatedFields) => {
    setUser(prev => prev ? { ...prev, ...updatedFields } : prev);
  }, []);

  const value = {
    user,
    loading,
    authLoading,
    error,
    isAuthenticated: !!user,
    superAdminExists,
    login,
    logout,
    register,
    registerSchool,
    setupSuperAdmin,
    updateUser,
    authFetch,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}