import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import { usePortalAuthStore } from "@/stores/portalAuthStore";
import type {
  PortalLoginResponse,
  PortalRegisterBody,
  PortalUser,
} from "@/types/portalAuth";

export function usePortalLogin() {
  const setAuth = usePortalAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (body: { email: string; password: string }) => {
      const res = await api.post<PortalLoginResponse>("/portal/login", body);
      return res.data as PortalLoginResponse;
    },
    onSuccess: (data) => {
      if (data.access_token && data.user) {
        setAuth(data.user, data.access_token, data.refresh_token);
      }
    },
  });
}

export function usePortalRegister() {
  return useMutation({
    mutationFn: async (body: PortalRegisterBody) => {
      const res = await api.post<unknown>("/portal/register", body);
      return res.data;
    },
  });
}

export function usePortalMe() {
  const isAuthenticated = usePortalAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["portal", "me"],
    queryFn: async () => {
      const res = await api.get<PortalUser>("/portal/me");
      return res.data as PortalUser;
    },
    enabled: isAuthenticated,
    retry: false,
    staleTime: 60_000,
  });
}

export function usePortalLogout() {
  const logout = usePortalAuthStore((s) => s.logout);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await api.post("/portal/logout");
      } catch {
        /* still clear session */
      }
    },
    onSettled: () => {
      logout();
      qc.clear();
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: async (token: string) => {
      const res = await api.post<{ message: string }>("/portal/verify-email", {
        token,
      });
      return res.data as { message: string };
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await api.post<{ message: string }>(
        "/portal/resend-verification",
        { email },
      );
      return res.data as { message: string };
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await api.post<{ message: string }>(
        "/portal/forgot-password",
        { email },
      );
      return res.data as { message: string };
    },
  });
}

export function usePortalResetPassword() {
  return useMutation({
    mutationFn: async (body: { token: string; password: string }) => {
      const res = await api.post<{ message: string }>("/portal/reset-password", {
        token: body.token,
        password: body.password,
      });
      return res.data as { message: string };
    },
  });
}
