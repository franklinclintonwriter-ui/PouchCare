/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const ADMIN_KEY = "pouchcare_admin_user";
const ADMIN_TOKEN_KEY = "pouchcare_admin_token";
const CUSTOMER_KEY = "pouchcare_customer_token";
const CUSTOMER_USER_KEY = "pouchcare_customer_user";

const AuthContext = createContext(null);

function readStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─────────────── API helpers ───────────────

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || "Request failed");
    err.status = res.status;
    err.code = data.code;
    err.email = data.email;
    throw err;
  }
  return data;
}

async function apiGet(path, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ─────────────── Provider ───────────────

export function AuthProvider({ children }) {
  // Admin auth (real API with localStorage persistence)
  const [adminUser, setAdminUser] = useState(() => readStorage(ADMIN_KEY));
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY));
  const [adminLoading, setAdminLoading] = useState(!!localStorage.getItem(ADMIN_TOKEN_KEY));

  // Customer auth (real API)
  const [customerToken, setCustomerToken] = useState(() => localStorage.getItem(CUSTOMER_KEY));
  const [customerUser, setCustomerUser] = useState(() => readStorage(CUSTOMER_USER_KEY));
  const [customerLoading, setCustomerLoading] = useState(!!localStorage.getItem(CUSTOMER_KEY));

  // On mount, validate existing admin token
  useEffect(() => {
    if (!adminToken) {
      setAdminLoading(false);
      return;
    }
    apiGet("/auth/me", adminToken)
      .then(({ user }) => {
        if (user.role !== "admin" && user.role !== "owner") {
          throw new Error("Not an admin");
        }
        setAdminUser(user);
        localStorage.setItem(ADMIN_KEY, JSON.stringify(user));
      })
      .catch(() => {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_KEY);
        setAdminToken(null);
        setAdminUser(null);
      })
      .finally(() => setAdminLoading(false));
  }, [adminToken]);

  // On mount, validate existing customer token
  useEffect(() => {
    if (!customerToken) {
      setCustomerLoading(false);
      return;
    }
    apiGet("/auth/me", customerToken)
      .then(({ user }) => {
        setCustomerUser(user);
        localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(user));
      })
      .catch(() => {
        localStorage.removeItem(CUSTOMER_KEY);
        localStorage.removeItem(CUSTOMER_USER_KEY);
        setCustomerToken(null);
        setCustomerUser(null);
      })
      .finally(() => setCustomerLoading(false));
  }, [customerToken]);

  // ─── Admin (real API — same login endpoint, role checked) ───

  const adminLogin = useCallback(async ({ email, password }) => {
    const data = await apiPost("/auth/login", { email, password });
    const user = data.user;
    if (user.role !== "admin" && user.role !== "owner") {
      throw new Error("This account does not have admin access.");
    }
    localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(user));
    setAdminToken(data.token);
    setAdminUser(user);
    return data;
  }, []);

  const adminLogout = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
    setAdminToken(null);
    setAdminUser(null);
  }, []);

  // ─── Customer (real API) ───

  const customerRegister = useCallback(async ({ name, email, password }) => {
    return apiPost("/auth/register", { name, email, password });
  }, []);

  const customerVerifyEmail = useCallback(async ({ email, code }) => {
    const data = await apiPost("/auth/verify-email", { email, code });
    localStorage.setItem(CUSTOMER_KEY, data.token);
    localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(data.user));
    setCustomerToken(data.token);
    setCustomerUser(data.user);
    return data;
  }, []);

  const customerResendCode = useCallback(async ({ email }) => {
    return apiPost("/auth/resend-code", { email });
  }, []);

  const customerLogin = useCallback(async ({ email, password }) => {
    const data = await apiPost("/auth/login", { email, password });
    localStorage.setItem(CUSTOMER_KEY, data.token);
    localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(data.user));
    setCustomerToken(data.token);
    setCustomerUser(data.user);
    return data;
  }, []);

  const customerForgotPassword = useCallback(async ({ email }) => {
    return apiPost("/auth/forgot-password", { email });
  }, []);

  const customerResetPassword = useCallback(async ({ token, password }) => {
    return apiPost("/auth/reset-password", { token, password });
  }, []);

  const customerLogout = useCallback(() => {
    localStorage.removeItem(CUSTOMER_KEY);
    localStorage.removeItem(CUSTOMER_USER_KEY);
    setCustomerToken(null);
    setCustomerUser(null);
  }, []);

  const value = useMemo(
    () => ({
      admin: {
        user: adminUser,
        token: adminToken,
        isAuthenticated: !!adminUser && !!adminToken,
        loading: adminLoading,
        login: adminLogin,
        logout: adminLogout,
      },
      customer: {
        user: customerUser,
        token: customerToken,
        isAuthenticated: !!customerUser && !!customerToken,
        loading: customerLoading,
        login: customerLogin,
        register: customerRegister,
        verifyEmail: customerVerifyEmail,
        resendCode: customerResendCode,
        forgotPassword: customerForgotPassword,
        resetPassword: customerResetPassword,
        logout: customerLogout,
      },
    }),
    [adminUser, adminToken, adminLoading, customerUser, customerToken, customerLoading, adminLogin, adminLogout, customerLogin, customerRegister, customerVerifyEmail, customerResendCode, customerForgotPassword, customerResetPassword, customerLogout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useAdminAuth() {
  const { admin } = useAuth();
  return admin;
}

export function useCustomerAuth() {
  const { customer } = useAuth();
  return customer;
}
