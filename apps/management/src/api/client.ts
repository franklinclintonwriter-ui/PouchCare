import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { getAccessToken, getRefreshToken, setAccessToken, clearAuth } from '@/utils/storage';
import { getApiOrigin, getAxiosBaseURL } from '@/config/apiOrigin';

const api = axios.create({
  baseURL: getAxiosBaseURL(),
  headers: { 'Content-Type': 'application/json' },
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
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
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
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
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
        if (!refreshToken) throw new Error('No refresh token');

        const userType = useAuthStore.getState().userType;
        const endpoint = userType === 'portal' ? '/portal/refresh' : '/auth/refresh';
        const origin = getApiOrigin();
        const refreshUrl = `${origin || ''}/v1${endpoint}`;
        const { data } = await axios.post(refreshUrl, { refresh_token: refreshToken });

        const newToken = data.data?.access_token ?? data.access_token;
        setAccessToken(newToken);
        useAuthStore.getState().updateTokens(newToken);

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth();
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // No HTTP response: offline, wrong API URL, CORS, or connection refused
    if (!error.response) {
      const code = (error as AxiosError & { code?: string }).code;
      if (code === 'ERR_NETWORK' || error.message === 'Network Error') {
        const origin = getApiOrigin();
        const hint = origin
          ? `Cannot reach the API at ${origin}. Is the server running?`
          : 'Cannot reach the API (connection failed). If the UI is not behind a reverse proxy, set VITE_API_URL in .env to your API origin (e.g. http://127.0.0.1:7000).';
        return Promise.reject(new Error(hint));
      }
      if (code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return Promise.reject(
          new Error('Request timed out. Check your connection and that the API is responding.'),
        );
      }
    }

    // Extract error message from envelope
    const message =
      (error.response?.data as { error?: string })?.error ||
      error.message ||
      'Something went wrong';

    return Promise.reject(new Error(message));
  },
);

export default api;
