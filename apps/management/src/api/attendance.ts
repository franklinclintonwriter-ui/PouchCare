import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import api from "./client";
import type { QueryParams, PaginatedResponse } from "@/types/api";
import type { AttendanceRecord } from "@/types/models";
import {
  attendanceKeys,
  invalidateAllAttendanceQueries,
} from "@/constants/queryKeys";

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
    checkIn: raw.checkInTime ?? '',
    checkOut: raw.checkOutTime ?? undefined,
    status: (raw.status ?? "PRESENT") as AttendanceRecord["status"],
    workType: (raw.workType ?? "OFFICE") as AttendanceRecord["workType"],
    hours: raw.hoursWorked ?? 0,
  };
}

/** Normalize API payload to a row array (supports `{ data: [] }` or legacy raw arrays). */
function rowsFromResponse<T>(data: unknown): T[] {
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: T[] }).data;
  }
  if (Array.isArray(data)) return data as T[];
  return [];
}

export function useAttendance(params?: QueryParams) {
  return useQuery<PaginatedResponse<AttendanceRecord>>({
    queryKey: attendanceKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get("/attendance", { params });
      const rows = rowsFromResponse<RawAttendance>(data);
      const body = data as PaginatedResponse<RawAttendance> & Record<string, unknown>;
      return {
        ...body,
        data: rows.map((item) => mapAttendance(item)),
      } as PaginatedResponse<AttendanceRecord>;
    },
  });
}

export function useMyAttendance() {
  return useQuery<AttendanceRecord[]>({
    queryKey: attendanceKeys.my,
    queryFn: async () => {
      const { data } = await api.get("/attendance", { params: { limit: 60 } });
      return rowsFromResponse<RawAttendance>(data).map((item) => mapAttendance(item));
    },
  });
}

export function useTeamAttendance(date?: string) {
  const d = date || new Date().toISOString().split("T")[0];
  return useQuery<AttendanceRecord[]>({
    queryKey: attendanceKeys.team(d),
    queryFn: async () => {
      const { data } = await api.get("/attendance", {
        params: { date: d, limit: 100 },
      });
      return rowsFromResponse<RawAttendance>(data).map((item) => mapAttendance(item));
    },
  });
}

const TEAM_ATTENDANCE_PAGE_SIZE = 40;

export type TeamAttendancePage = {
  data: AttendanceRecord[];
  meta: { page: number; totalPages: number; total: number; limit: number };
};

/** Paginated team board for a calendar day — use “Load more” or `fetchNextPage`. */
export function useTeamAttendanceInfinite(date?: string, pageSize = TEAM_ATTENDANCE_PAGE_SIZE) {
  const d = date || new Date().toISOString().split("T")[0];
  return useInfiniteQuery({
    queryKey: [...attendanceKeys.team(d), "infinite", pageSize] as const,
    queryFn: async ({ pageParam }): Promise<TeamAttendancePage> => {
      const page = typeof pageParam === "number" ? pageParam : 1;
      const { data } = await api.get("/attendance", {
        params: { date: d, limit: pageSize, page },
      });
      const rows = rowsFromResponse<RawAttendance>(data);
      const body = data as { meta?: TeamAttendancePage["meta"] };
      const mapped = rows.map((item) => mapAttendance(item));
      const meta =
        body.meta ??
        ({
          page,
          limit: pageSize,
          total: mapped.length,
          totalPages: 1,
        } as TeamAttendancePage["meta"]);
      return { data: mapped, meta };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      if (page < totalPages) return page + 1;
      return undefined;
    },
  });
}

export function useTodayAttendance() {
  return useQuery<TodayAttendance | null>({
    queryKey: attendanceKeys.today,
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
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: attendanceKeys.today });
      const prevToday = qc.getQueryData<TodayAttendance | null>(attendanceKeys.today);
      const wt = (body?.workType as TodayAttendance["workType"] | undefined) ?? "OFFICE";
      if (prevToday) {
        qc.setQueryData<TodayAttendance | null>(attendanceKeys.today, {
          ...prevToday,
          checkInTime: new Date().toISOString(),
          workType: wt,
        });
      }
      return { prevToday };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevToday !== undefined) {
        qc.setQueryData(attendanceKeys.today, ctx.prevToday);
      }
    },
    onSettled: () => {
      void invalidateAllAttendanceQueries(qc);
    },
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body?: Record<string, unknown>) =>
      api.post("/attendance/checkout", body),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: attendanceKeys.today });
      const prevToday = qc.getQueryData<TodayAttendance | null>(attendanceKeys.today);
      if (prevToday?.checkInTime && !prevToday.checkOutTime) {
        const now = new Date();
        const checkIn = new Date(prevToday.checkInTime);
        const hours = Math.min(12, Math.max(0, (now.getTime() - checkIn.getTime()) / 3600000));
        qc.setQueryData<TodayAttendance | null>(attendanceKeys.today, {
          ...prevToday,
          checkOutTime: now.toISOString(),
          hoursWorked: Math.round(hours * 100) / 100,
        });
      }
      return { prevToday };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevToday !== undefined) {
        qc.setQueryData(attendanceKeys.today, ctx.prevToday);
      }
    },
    onSettled: () => {
      void invalidateAllAttendanceQueries(qc);
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
    queryKey: attendanceKeys.staff(staffId, params),
    queryFn: async () => {
      const { data } = await api.get(`/attendance/staff/${staffId}`, { params });
      const rows = rowsFromResponse<RawAttendance>(data);
      const body = data as PaginatedResponse<RawAttendance> & Record<string, unknown>;
      return {
        ...body,
        data: rows.map((item) => mapAttendance(item)),
      } as PaginatedResponse<AttendanceRecord>;
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
    onSettled: () => {
      void invalidateAllAttendanceQueries(qc);
    },
  });
}

export function useDeleteAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/attendance/${id}`),
    onSettled: () => {
      void invalidateAllAttendanceQueries(qc);
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
    onSettled: () => {
      void invalidateAllAttendanceQueries(qc);
    },
  });
}
