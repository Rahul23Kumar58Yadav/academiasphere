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
  SUPER_ADMIN: "/super-admin/dashboard",
  SCHOOL_ADMIN: "/school-admin/dashboard",
  TEACHER: "/teacher/dashboard",
  STUDENT: "/student/dashboard",
  PARENT: "/parent/dashboard",
  VENDOR: "/vendor/dashboard",
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState(null);
  const [superAdminExists, setSuperAdminExists] = useState(null);   // ← Fixed: was missing

  const logoutRef = useRef(null);

  // Silent refresh for token
  const silentRefresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  // Main authenticated fetch
  const authFetch = useCallback(async (url, options = {}) => {
    const fullUrl = `${API_BASE}${url.startsWith("/") ? url : "/" + url}`;

    let response = await fetch(fullUrl, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (response.status === 401) {
      const refreshed = await silentRefresh();
      if (refreshed) {
        response = await fetch(fullUrl, {
          ...options,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
          },
        });
      } else {
        logoutRef.current?.();
        return null;
      }
    }

    return response;
  }, [silentRefresh]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (_) {}
    setUser(null);
    setError(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  // Bootstrap current user
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const res = await authFetch("/auth/me");
        if (res?.ok) {
          const data = await res.json();
          setUser(data.user || data);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth bootstrap failed:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [authFetch]);

  // Check if super admin exists (for setup page)
  useEffect(() => {
    fetch(`${API_BASE}/auth/super-admin-exists`)
      .then((r) => r.json())
      .then((d) => setSuperAdminExists(d.exists ?? false))
      .catch(() => setSuperAdminExists(false));
  }, []);

  // Login
  const login = useCallback(async (email, password, isSuperAdmin = false) => {
    setAuthLoading(true);
    setError(null);
    try {
      const endpoint = isSuperAdmin ? "/auth/super-admin/login" : "/auth/login";
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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

  // Register normal user
  const register = useCallback(async (payload) => {
    setAuthLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  // Register School
  const registerSchool = useCallback(async (payload) => {
    setAuthLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/schools/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  // Setup Super Admin
  const setupSuperAdmin = useCallback(async (payload) => {
    setAuthLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/setup-super-admin`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data.message || "Setup failed";
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
    authFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}