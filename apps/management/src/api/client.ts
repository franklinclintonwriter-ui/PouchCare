import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { getAccessToken, getRefreshToken, setAccessToken, clearAuth } from '@/utils/storage';

const api = axios.create({
  baseURL: '/v1',
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
    // Unwrap the API envelope: { success: true, data: T, meta? }
    if (response.data?.success !== undefined) {
      const envelope = response.data;
      if (envelope.meta) {
        return { ...response, data: { data: envelope.data, meta: envelope.meta } };
      }
      return { ...response, data: envelope.data };
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
        const { data } = await axios.post(`/v1${endpoint}`, { refresh_token: refreshToken });

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

    // Extract error message from envelope
    const message =
      (error.response?.data as { error?: string })?.error ||
      error.message ||
      'Something went wrong';

    return Promise.reject(new Error(message));
  },
);

export default api;
