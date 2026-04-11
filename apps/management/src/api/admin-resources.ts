import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "./client";
import type { PaginatedResponse, QueryParams } from "@/types/api";

type RawBranch = {
  id: string;
  name: string;
  country?: string | null;
  city?: string | null;
  type?: string | null;
  status?: string | null;
  branchManager?: string | null;
  staffCount?: number | null;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
};

type RawDevice = {
  id: string;
  staffMemberId: string;
  deviceName: string;
  deviceType?: string | null;
  ipAddress?: string | null;
  status?: string | null;
  branch?: string | null;
  createdAt: string;
};

type RawClientAccount = {
  id: string;
  clientName?: string | null;
  email?: string | null;
  country?: string | null;
  status?: string | null;
  totalSpentUsd?: number | null;
  totalOrders?: number | null;
  createdAt: string;
};

type RawExchangeRate = {
  id: string;
  usdToBdt: number;
  usdToAed?: number | null;
  bdtToAed?: number | null;
  effectiveDate: string;
  createdAt: string;
};

export interface Branch {
  id: string;
  name: string;
  country?: string;
  city?: string;
  type?: string;
  status: string;
  branchManager?: string;
  staffCount?: number;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  establishedDate?: string;
  createdAt: string;
}

export interface BranchStats {
  memberCount: number;
  activeCount: number;
  byRole: Record<string, number>;
  totalTasksCompleted: number;
  avgTaskRating: number | null;
}

/** Mirrors API: counts of rows that store this branch name (blocks delete until zero). */
export interface BranchReferenceBreakdown {
  total: number;
  staffMembers: number;
  tasks: number;
  projects: number;
  attendance: number;
  leaveRequests: number;
  dailyReports: number;
  performanceRatings: number;
  payroll: number;
  devices: number;
  expenses: number;
  salesOrders: number;
  jobPositions: number;
}

export interface BranchManagerMember {
  id: string;
  name: string;
  email: string;
  systemRole: string;
  jobRole?: string | null;
}

export interface BranchDetailPayload {
  branch: Branch;
  stats: BranchStats;
  managerMember: BranchManagerMember | null;
  references: BranchReferenceBreakdown;
}

export type BranchMemberRow = {
  id: string;
  memberId: number;
  name: string;
  email: string;
  systemRole: string;
  status: string;
  branch: string | null;
  jobRole: string | null;
  primarySkill: string | null;
  joinDate: string | null;
  salary: number | null;
  averageTaskRating: number | null;
  ceoPerformanceRating: number | null;
  tasksCompleted: number;
  phone: string | null;
  whatsapp: string | null;
};

export interface Device {
  id: string;
  staffMemberId: string;
  deviceName: string;
  deviceType?: string;
  ipAddress?: string;
  status: string;
  branch?: string;
  createdAt: string;
}

export interface ClientAccount {
  id: string;
  clientName: string;
  email: string;
  country?: string;
  status: string;
  totalSpentUsd: number;
  totalOrders: number;
  createdAt: string;
}

export interface ExchangeRate {
  id: string;
  usdToBdt: number;
  usdToAed?: number;
  bdtToAed?: number;
  effectiveDate: string;
  createdAt: string;
}

function normalizeStatus(status?: string | null): string {
  const value = (status ?? "").trim().toLowerCase();
  if (!value) return "Active";
  if (value === "active") return "Active";
  if (value === "inactive") return "Inactive";
  if (value === "suspended") return "Suspended";
  if (value === "pending") return "Pending";
  return status ?? "Active";
}

function mapBranch(
  raw: RawBranch & {
    address?: string | null;
    notes?: string | null;
    establishedDate?: string | null;
  },
): Branch {
  return {
    id: raw.id,
    name: raw.name,
    country: raw.country ?? undefined,
    city: raw.city ?? undefined,
    type: raw.type ?? undefined,
    status: normalizeStatus(raw.status),
    branchManager: raw.branchManager ?? undefined,
    staffCount: raw.staffCount ?? 0,
    email: raw.email ?? undefined,
    phone: raw.phone ?? undefined,
    address: raw.address ?? undefined,
    notes: raw.notes ?? undefined,
    establishedDate: raw.establishedDate ?? undefined,
    createdAt: raw.createdAt,
  };
}

function mapDevice(raw: RawDevice): Device {
  return {
    id: raw.id,
    staffMemberId: raw.staffMemberId,
    deviceName: raw.deviceName,
    deviceType: raw.deviceType ?? undefined,
    ipAddress: raw.ipAddress ?? undefined,
    status: normalizeStatus(raw.status),
    branch: raw.branch ?? undefined,
    createdAt: raw.createdAt,
  };
}

function mapClientAccount(raw: RawClientAccount): ClientAccount {
  return {
    id: raw.id,
    clientName: raw.clientName ?? "Client",
    email: raw.email ?? "-",
    country: raw.country ?? undefined,
    status: normalizeStatus(raw.status),
    totalSpentUsd: raw.totalSpentUsd ?? 0,
    totalOrders: raw.totalOrders ?? 0,
    createdAt: raw.createdAt,
  };
}

function mapExchangeRate(raw: RawExchangeRate): ExchangeRate {
  return {
    id: raw.id,
    usdToBdt: raw.usdToBdt,
    usdToAed: raw.usdToAed ?? undefined,
    bdtToAed: raw.bdtToAed ?? undefined,
    effectiveDate: raw.effectiveDate,
    createdAt: raw.createdAt,
  };
}

export function useBranches(params?: QueryParams) {
  return useQuery<PaginatedResponse<Branch>>({
    queryKey: ["admin-branches", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/branches", { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return { ...data, data: rows.map((item: RawBranch) => mapBranch(item)) };
    },
  });
}

export function useBranchDetail(id: string | undefined) {
  return useQuery<BranchDetailPayload>({
    queryKey: ["admin-branch", id],
    queryFn: async () => {
      const { data } = await api.get(`/admin/branches/${id}`);
      const emptyRefs: BranchReferenceBreakdown = {
        total: 0,
        staffMembers: 0,
        tasks: 0,
        projects: 0,
        attendance: 0,
        leaveRequests: 0,
        dailyReports: 0,
        performanceRatings: 0,
        payroll: 0,
        devices: 0,
        expenses: 0,
        salesOrders: 0,
        jobPositions: 0,
      };
      const payload = data as {
        branch: RawBranch & {
          address?: string | null;
          notes?: string | null;
          establishedDate?: string | null;
        };
        stats: BranchStats;
        managerMember: BranchManagerMember | null;
        references?: BranchReferenceBreakdown;
      };
      return {
        branch: mapBranch(payload.branch),
        stats: payload.stats,
        managerMember: payload.managerMember,
        references: payload.references ?? emptyRefs,
      };
    },
    enabled: !!id,
  });
}

export function useBranchMembers(
  branchId: string | undefined,
  params?: QueryParams,
) {
  return useQuery<PaginatedResponse<BranchMemberRow>>({
    queryKey: ["admin-branch-members", branchId, params],
    queryFn: async () => {
      const { data } = await api.get(`/admin/branches/${branchId}/members`, {
        params,
      });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return { ...data, data: rows as BranchMemberRow[] };
    },
    enabled: !!branchId,
  });
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Branch>) => api.post("/admin/branches", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-branches"] });
      qc.invalidateQueries({ queryKey: ["staff-list"] });
    },
  });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Branch> & { id: string }) =>
      api.put(`/admin/branches/${id}`, body),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["admin-branches"] });
      qc.invalidateQueries({ queryKey: ["admin-branch", v.id] });
      qc.invalidateQueries({ queryKey: ["admin-branch-members", v.id] });
      qc.invalidateQueries({ queryKey: ["staff-list"] });
      qc.invalidateQueries({ queryKey: ["staff-leaderboard"] });
    },
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/branches/${id}`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["admin-branches"] });
      qc.invalidateQueries({ queryKey: ["staff-list"] });
      qc.removeQueries({ queryKey: ["admin-branch", id] });
      qc.removeQueries({ queryKey: ["admin-branch-members", id] });
    },
  });
}

/** Staff member eligible to be a branch manager (for Select dropdowns). */
export interface ManagerCandidate {
  id: string;
  name: string;
  systemRole: string;
  jobRole: string | null;
  branch: string | null;
  email: string;
}

/**
 * Fetch all active staff members (for selecting a manager when creating a new branch).
 * Optional `branch` param filters to staff already at that branch.
 */
export function useStaffForManager(branchName?: string) {
  return useQuery<ManagerCandidate[]>({
    queryKey: ["staff-for-manager", branchName],
    queryFn: async () => {
      const params = branchName ? { branch: branchName } : {};
      const { data } = await api.get("/admin/staff-for-manager", { params });
      return (Array.isArray(data) ? data : []) as ManagerCandidate[];
    },
  });
}

/**
 * Fetch staff at a specific branch who can be set as manager (for editing an existing branch).
 */
export function useBranchManagerCandidates(branchId: string | undefined) {
  return useQuery<ManagerCandidate[]>({
    queryKey: ["branch-manager-candidates", branchId],
    queryFn: async () => {
      const { data } = await api.get(
        `/admin/branches/${branchId}/manager-candidates`,
      );
      return (Array.isArray(data) ? data : []) as ManagerCandidate[];
    },
    enabled: !!branchId,
  });
}

export function useDevices(params?: QueryParams) {
  return useQuery<PaginatedResponse<Device>>({
    queryKey: ["admin-devices", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/devices", { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return { ...data, data: rows.map((item: RawDevice) => mapDevice(item)) };
    },
  });
}

export function useCreateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Device>) => api.post("/admin/devices", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-devices"] }),
  });
}

export function useClientAccounts(params?: QueryParams) {
  return useQuery<PaginatedResponse<ClientAccount>>({
    queryKey: ["admin-client-accounts", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/client-accounts", { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return {
        ...data,
        data: rows.map((item: RawClientAccount) => mapClientAccount(item)),
      };
    },
  });
}

export function useCreateClientAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<ClientAccount>) =>
      api.post("/admin/client-accounts", body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-client-accounts"] }),
  });
}

export function useUpdateClientAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<ClientAccount> & { id: string }) =>
      api.put(`/admin/client-accounts/${id}`, body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-client-accounts"] }),
  });
}

export function useDeleteClientAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/client-accounts/${id}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-client-accounts"] }),
  });
}

export function useExchangeRates(params?: QueryParams) {
  return useQuery<PaginatedResponse<ExchangeRate>>({
    queryKey: ["admin-exchange-rates", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/exchange-rates", { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return {
        ...data,
        data: rows.map((item: RawExchangeRate) => mapExchangeRate(item)),
      };
    },
  });
}

export function useCreateExchangeRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<ExchangeRate>) =>
      api.post("/admin/exchange-rates", body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-exchange-rates"] }),
  });
}

export function useUpdateExchangeRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<ExchangeRate> & { id: string }) =>
      api.put(`/admin/exchange-rates/${id}`, body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-exchange-rates"] }),
  });
}

export function useDeleteExchangeRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/exchange-rates/${id}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-exchange-rates"] }),
  });
}

export function useDevice(id: string | undefined) {
  return useQuery<Device | null>({
    queryKey: ["admin-device", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/admin/devices/${id}`);
      return mapDevice(data as RawDevice);
    },
    enabled: !!id,
  });
}

export function useUpdateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Device> & { id: string }) =>
      api.put(`/admin/devices/${id}`, body),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["admin-devices"] });
      qc.invalidateQueries({ queryKey: ["admin-device", v.id] });
    },
  });
}

export function useDeleteDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/devices/${id}`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["admin-devices"] });
      qc.removeQueries({ queryKey: ["admin-device", id] });
    },
  });
}

export function useClientAccount(id: string | undefined) {
  return useQuery<ClientAccount | null>({
    queryKey: ["admin-client-account", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/admin/client-accounts/${id}`);
      return mapClientAccount(data as RawClientAccount);
    },
    enabled: !!id,
  });
}
