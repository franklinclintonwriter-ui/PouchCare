import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getApiOrigin, getAxiosBaseURL } from "@/config/apiOrigin";
import { paths } from "@/routes/paths";
import { usePortalAuthStore } from "@/stores/portalAuthStore";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  clearPortalAuth,
} from "@/utils/portalStorage";

const api = axios.create({
  baseURL: getAxiosBaseURL(),
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === "object" &&
      "success" in response.data
    ) {
      const envelope = response.data as {
        success: boolean;
        data?: unknown;
        meta?: unknown;
      };
      if (envelope.meta !== undefined) {
        response.data = { data: envelope.data, meta: envelope.meta };
      } else {
        response.data = envelope.data;
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        const msg =
          (error.response?.data as { error?: string })?.error ||
          "Session expired";
        return Promise.reject(new Error(msg));
      }

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
        const origin = getApiOrigin();
        const refreshUrl = `${origin || ""}/v1/portal/refresh`;
        const res = await axios.post(refreshUrl, { refresh_token: refreshToken });
        const body = res.data as {
          success?: boolean;
          data?: { access_token?: string };
        };
        const newAccess = body.data?.access_token;
        if (!newAccess) throw new Error("No access token from refresh");

        setAccessToken(newAccess);
        usePortalAuthStore.getState().updateTokens(newAccess);
        processQueue(null, newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearPortalAuth();
        usePortalAuthStore.getState().logout();
        window.location.assign(paths.login);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (!error.response) {
      const code = (error as AxiosError & { code?: string }).code;
      if (code === "ERR_NETWORK" || error.message === "Network Error") {
        const origin = getApiOrigin();
        const hint = origin
          ? `Cannot reach the API at ${origin}. Is the server running?`
          : "Cannot reach the API. Ensure the API runs on :7000 or set VITE_API_URL.";
        return Promise.reject(new Error(hint));
      }
    }

    const message =
      (error.response?.data as { error?: string })?.error ||
      error.message ||
      "Something went wrong";

    return Promise.reject(new Error(message));
  },
);

export default api;
