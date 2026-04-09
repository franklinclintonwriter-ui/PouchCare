import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './client';
import { useAuthStore } from '@/store/authStore';
import { normalizeRole } from '@/utils/permissions';
import type {
  LoginRequest,
  LoginResponse,
  PortalLoginResponse,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  StaffUser,
  PortalUser,
} from '@/types/auth';

export function normalizeStaffUser(user: StaffUser & { role?: StaffUser['systemRole'] }): StaffUser {
  const normalizedRole = normalizeRole(user.systemRole ?? user.role);
  return {
    ...user,
    systemRole: (normalizedRole ?? 'STAFF') as StaffUser['systemRole'],
  };
}

// ── Staff Auth ──────────────────────────────────────────

export function useStaffLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const res = await api.post<LoginResponse>('/auth/login', data);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.access_token && data.user) {
        setAuth(normalizeStaffUser(data.user as StaffUser & { role?: StaffUser['systemRole'] }), data.access_token, data.refresh_token, 'staff');
      }
    },
  });
}

export function useStaffMe() {
  const { isAuthenticated, userType, setLoading } = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await api.get<StaffUser & { role?: StaffUser['systemRole'] }>('/staff/me');
      return normalizeStaffUser(res.data);
    },
    enabled: isAuthenticated && userType === 'staff',
    retry: false,
    staleTime: 5 * 60 * 1000,
    meta: { onSettled: () => setLoading(false) },
  });
}

export function useUpdateStaffProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name?: string; phone?: string; whatsapp?: string; country?: string; portfolioUrl?: string }) => {
      const res = await api.put('/staff/me', body);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useStaffLogout() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      logout();
      queryClient.clear();
    },
  });
}

export function useSetup2FA() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (password: string) => {
      const res = await api.post<{ secret: string; otpauthUrl: string }>('/auth/2fa/setup', { password });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useVerify2FA() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const res = await api.post<{ message: string }>('/auth/2fa/verify', { code });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useChangeStaffPassword() {
  return useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      const res = await api.post<{ message: string }>('/auth/change-password', {
        current_password: payload.currentPassword,
        new_password: payload.newPassword,
      });
      return res.data;
    },
  });
}

// ── Portal Auth ─────────────────────────────────────────

export function usePortalLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const res = await api.post<PortalLoginResponse>('/portal/login', data);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.access_token && data.user) {
        setAuth(data.user, data.access_token, data.refresh_token, 'portal');
      }
    },
  });
}

export function usePortalRegister() {
  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const res = await api.post<{ message: string; member: { id: string; email: string; fullName: string; referralCode: string } }>('/portal/register', data);
      return res.data;
    },
  });
}

export function usePortalMe() {
  const { isAuthenticated, userType, setLoading } = useAuthStore();

  return useQuery({
    queryKey: ['portal', 'me'],
    queryFn: async () => {
      const res = await api.get<PortalUser>('/portal/me');
      return res.data;
    },
    enabled: isAuthenticated && userType === 'portal',
    retry: false,
    staleTime: 5 * 60 * 1000,
    meta: { onSettled: () => setLoading(false) },
  });
}

export function usePortalLogout() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post('/portal/logout'),
    onSettled: () => {
      logout();
      queryClient.clear();
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: async (token: string) => {
      const res = await api.post<{ message: string }>('/portal/verify-email', { token });
      return res.data;
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await api.post<{ message: string }>('/portal/resend-verification', { email });
      return res.data;
    },
  });
}

export function useChangePortalPassword() {
  return useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      const res = await api.post<{ message: string }>('/portal/change-password', {
        current_password: payload.currentPassword,
        new_password: payload.newPassword,
      });
      return res.data;
    },
  });
}

// ── Shared ──────────────────────────────────────────────

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (data: ForgotPasswordRequest & { type: 'staff' | 'portal' }) => {
      const endpoint = data.type === 'portal' ? '/portal/forgot-password' : '/auth/forgot-password';
      const res = await api.post<{ message: string }>(endpoint, { email: data.email });
      return res.data;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: ResetPasswordRequest & { type: 'staff' | 'portal' }) => {
      const endpoint = data.type === 'portal' ? '/portal/reset-password' : '/auth/reset-password';
      const res = await api.post<{ message: string }>(endpoint, {
        token: data.token,
        password: data.password,
      });
      return res.data;
    },
  });
}
