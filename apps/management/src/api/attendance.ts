import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./client";
import type { QueryParams, PaginatedResponse } from "@/types/api";
import type { AttendanceRecord } from "@/types/models";

type RawAttendance = {
  id: string;
  staffMemberId: string;
  name: string;
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status?: string | null;
  workType?: string | null;
  hoursWorked?: number | null;
};

export type TodayAttendance = {
  id: string;
  date: string;
  status: AttendanceRecord["status"];
  workType: AttendanceRecord["workType"];
  checkInTime?: string;
  checkOutTime?: string;
  hoursWorked: number;
};

function mapAttendance(raw: RawAttendance): AttendanceRecord {
  return {
    id: raw.id,
    staffId: raw.staffMemberId,
    staffName: raw.name,
    date: raw.date,
    checkIn: raw.checkInTime ?? "",
    checkOut: raw.checkOutTime ?? undefined,
    status: (raw.status ?? "PRESENT") as AttendanceRecord["status"],
    workType: (raw.workType ?? "OFFICE") as AttendanceRecord["workType"],
    hours: raw.hoursWorked ?? 0,
  };
}

export function useAttendance(params?: QueryParams) {
  return useQuery<PaginatedResponse<AttendanceRecord>>({
    queryKey: ["attendance", params],
    queryFn: async () => {
      const { data } = await api.get("/attendance", { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return {
        ...data,
        data: rows.map((item: RawAttendance) => mapAttendance(item)),
      };
    },
  });
}

export function useMyAttendance() {
  return useQuery<AttendanceRecord[]>({
    queryKey: ["my-attendance"],
    queryFn: async () => {
      const { data } = await api.get("/attendance", { params: { limit: 60 } });
      const rows = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];
      return rows.map((item: RawAttendance) => mapAttendance(item));
    },
  });
}

export function useTeamAttendance(date?: string) {
  const d = date || new Date().toISOString().split("T")[0];
  return useQuery<AttendanceRecord[]>({
    queryKey: ["team-attendance", d],
    queryFn: async () => {
      const { data } = await api.get("/attendance", {
        params: { date: d, limit: 100 },
      });
      const rows = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];
      return rows.map((item: RawAttendance) => mapAttendance(item));
    },
  });
}

export function useTodayAttendance() {
  return useQuery<TodayAttendance | null>({
    queryKey: ["attendance-today"],
    queryFn: async () => {
      const { data } = await api.get("/attendance/today");
      if (!data) return null;
      return {
        id: data.id,
        date: data.date,
        status: (data.status ?? "PRESENT") as AttendanceRecord["status"],
        workType: (data.workType ?? "OFFICE") as AttendanceRecord["workType"],
        checkInTime: data.checkInTime ?? undefined,
        checkOutTime: data.checkOutTime ?? undefined,
        hoursWorked: data.hoursWorked ?? 0,
      };
    },
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body?: Record<string, unknown>) =>
      api.post("/attendance/checkin", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["my-attendance"] });
      qc.invalidateQueries({ queryKey: ["attendance-today"] });
    },
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body?: Record<string, unknown>) =>
      api.post("/attendance/checkout", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["my-attendance"] });
      qc.invalidateQueries({ queryKey: ["attendance-today"] });
      qc.invalidateQueries({ queryKey: ["team-attendance"] });
    },
  });
}

export function useStaffAttendance(
  staffId: string,
  params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  },
) {
  return useQuery<PaginatedResponse<AttendanceRecord>>({
    queryKey: ["staff-attendance", staffId, params],
    queryFn: async () => {
      const { data } = await api.get(`/attendance/${staffId}`, { params });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return {
        ...data,
        data: rows.map((item: RawAttendance) => mapAttendance(item)),
      };
    },
    enabled: !!staffId,
  });
}

interface UpdateAttendanceInput {
  status?: string;
  workType?: string;
  checkInTime?: string;
  checkOutTime?: string;
  hoursWorked?: number;
  overtimeHours?: number;
  notes?: string;
}

export function useUpdateAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateAttendanceInput & { id: string }) =>
      api.put(`/attendance/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["my-attendance"] });
      qc.invalidateQueries({ queryKey: ["team-attendance"] });
      qc.invalidateQueries({ queryKey: ["staff-attendance"] });
    },
  });
}

export function useDeleteAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/attendance/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["my-attendance"] });
      qc.invalidateQueries({ queryKey: ["team-attendance"] });
      qc.invalidateQueries({ queryKey: ["staff-attendance"] });
    },
  });
}

interface CreateAttendanceInput {
  staffMemberId: string;
  date: string;
  status: AttendanceRecord["status"];
  workType?: AttendanceRecord["workType"];
  checkInTime?: string;
  checkOutTime?: string;
  hoursWorked?: number;
  notes?: string;
}

export function useCreateAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAttendanceInput) => api.post("/attendance", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["team-attendance"] });
      qc.invalidateQueries({ queryKey: ["staff-attendance"] });
    },
  });
}
