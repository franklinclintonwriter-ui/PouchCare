import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./client";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scope: "plugin_download" | "general";
  isActive: boolean;
  createdById: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface CreatedApiKey extends ApiKey {
  rawKey: string;
}

export interface RotatedApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scope: "plugin_download" | "general";
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  rawKey: string;
}

// ── Hooks ─────────────────────────────────────────────────────────────────

export function useApiKeys() {
  return useQuery<ApiKey[]>({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const res = await api.get("/api-keys");
      return res.data.data;
    },
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      scope?: "plugin_download" | "general";
      expiresAt?: string;
    }) => {
      const res = await api.post("/api-keys", data);
      return res.data.data as CreatedApiKey;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api-keys/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });
}

export function useUpdateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      name?: string;
      scope?: "plugin_download" | "general";
      expiresAt?: string | null;
      isActive?: boolean;
    }) => {
      const res = await api.put(`/api-keys/${id}`, body);
      return res.data.data as ApiKey;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });
}

export function useRotateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/api-keys/${id}/rotate`);
      return res.data.data as RotatedApiKey;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });
}
