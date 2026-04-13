export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  code?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  /** Present on CRM list endpoints: branch managers see a scoped dataset. */
  crmView?: 'full' | 'branch_manager';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface FilterParams {
  q?: string;
  status?: string;
  priority?: string;
  branch?: string;
  role?: string;
  /** Filter tasks by project UUID (`relatedProject` matches project name or id). */
  projectId?: string;
  /** Staff list: whitelist `name` | `email` | `joinDate` | `memberId` | `systemRole` | `createdAt` */
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  [key: string]: string | number | undefined;
}

export type QueryParams = PaginationParams & FilterParams;

/** Returned in `meta` when creating an email broadcast. */
export interface BroadcastDeliverySummary {
  attempted: number;
  sent: number;
  skipped: number;
  failed: number;
  failures?: { to: string; error: string }[];
}
