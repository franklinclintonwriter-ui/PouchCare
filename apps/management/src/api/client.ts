import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  clearAuth,
} from "@/utils/storage";
import { getApiOrigin, getAxiosBaseURL } from "@/config/apiOrigin";

const api = axios.create({
  baseURL: getAxiosBaseURL(),
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Request interceptor: attach token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: unwrap envelope + handle 401 refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token!);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => {
    // If the API returns { success, data, meta }, unwrap it
    if (
      response.data &&
      typeof response.data === "object" &&
      "success" in response.data
    ) {
      if (response.data.meta) {
        // Return unwrapped data and meta for paginated endpoints
        response.data = { data: response.data.data, meta: response.data.meta };
      } else {
        // Return just the unwrapped data for standard endpoints
        response.data = response.data.data;
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Never try to refresh on auth/login endpoints — surface the 401 directly as "Invalid credentials".
    const isAuthEndpoint = /\/(auth|portal)\/(login|register|refresh|forgot|reset)/.test(
      originalRequest.url ?? "",
    );

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token");

        const userType = useAuthStore.getState().userType;
        const endpoint =
          userType === "portal" ? "/portal/refresh" : "/auth/refresh";
        const origin = getApiOrigin();
        const refreshUrl = `${origin || ""}/v1${endpoint}`;
        const { data } = await axios.post(refreshUrl, {
          refresh_token: refreshToken,
        });

        const newToken = data.data?.access_token ?? data.access_token;
        setAccessToken(newToken);
        useAuthStore.getState().updateTokens(newToken);

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth();
        const currentType = useAuthStore.getState().userType;
        useAuthStore.getState().logout();
        window.location.href = currentType === "portal" ? "/portal/login" : "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // No HTTP response: offline, wrong API URL, CORS, or connection refused
    if (!error.response) {
      const code = (error as AxiosError & { code?: string }).code;
      if (code === "ERR_NETWORK" || error.message === "Network Error") {
        return Promise.reject(
          new Error(
            "Unable to connect to the server. Please check your network connection and try again.",
          ),
        );
      }
      if (code === "ECONNABORTED" || error.message?.includes("timeout")) {
        return Promise.reject(
          new Error(
            "The request timed out. Please check your connection and try again.",
          ),
        );
      }
    }

    // Extract error message: API returns { error, code }; axios default message is useless ("Request failed with status code 500")
    const status = error.response?.status;
    const raw = error.response?.data as unknown;
    let message = error.message || "Something went wrong";

    if (raw && typeof raw === "object" && raw !== null && "error" in raw) {
      const e = (raw as { error?: unknown; prismaCode?: string }).error;
      if (typeof e === "string" && e.length > 0) {
        message = e;
        const pc = (raw as { prismaCode?: string }).prismaCode;
        if (import.meta.env.DEV && pc) message = `${message} (${pc})`;
      }
    } else if (status === 500) {
      message =
        "Server error (500). Is the API running? From apps/api run: npx prisma migrate deploy, then restart the API container.";
    } else if (status === 503) {
      message =
        (raw && typeof raw === "object" && raw !== null && "error" in raw
          ? String((raw as { error?: string }).error)
          : null) || "Service unavailable (database or Redis may be down).";
    }

    return Promise.reject(new Error(message));
  },
);

export default api;
