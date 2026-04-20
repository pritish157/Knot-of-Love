import { createContext, useCallback, useEffect, useRef, useState, useMemo } from "react";
import { loginRequest, registerRequest } from "../services/auth";
import { apiRequest } from "../services/http";
import { clearAuthStorage, getStoredAuth, persistAuth } from "../utils/storage";

export const AuthContext = createContext(null);

function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false;
    return Date.now() >= (payload.exp * 1000) - 30_000;
  } catch {
    return true;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const stored = getStoredAuth();

    if (!stored.token || isTokenExpired(stored.token)) {
      clearAuthStorage();
      setBootstrapping(false);
      return;
    }

    setToken(stored.token);
    setUser(stored.user);

    apiRequest("/api/auth/me", {
      headers: { Authorization: `Bearer ${stored.token}` }
    })
      .then((data) => {
        const freshUser = data.user || stored.user;
        setUser(freshUser);
        persistAuth(stored.token, freshUser);
      })
      .catch(() => {
        clearAuthStorage();
        setToken("");
        setUser(null);
      })
      .finally(() => setBootstrapping(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await loginRequest(credentials);
    const nextToken = data.token || "";
    const nextUser = data.user || {};
    setToken(nextToken);
    setUser(nextUser);
    persistAuth(nextToken, nextUser);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    return registerRequest(payload);
  }, []);

  const logout = useCallback(() => {
    setToken("");
    setUser(null);
    clearAuthStorage();
  }, []);

  // Refresh user data from server (call after profile updates)
  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest("/api/auth/me");
      if (data.user) {
        setUser(data.user);
        persistAuth(token, data.user);
      }
    } catch {
      // silent fail
    }
  }, [token]);

  // Update user locally (optimistic update after onboarding steps)
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    if (token) persistAuth(token, updatedUser);
  }, [token]);

  // Set token + user directly (used after OTP verify auto-login)
  const setAuth = useCallback((newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    persistAuth(newToken, newUser);
  }, []);

  const value = useMemo(() => ({
    token,
    user,
    bootstrapping,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
    refreshUser,
    updateUser,
    setAuth
  }), [token, user, bootstrapping, login, register, logout, refreshUser, updateUser, setAuth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
