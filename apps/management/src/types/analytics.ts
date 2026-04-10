// ── Trend Types ─────────────────────────────────────────────────────────────

export interface Trend {
  change: number;
  direction: 'up' | 'down' | 'neutral';
}

// ── Health Score ────────────────────────────────────────────────────────────

export interface HealthScore {
  total: number;
  breakdown: {
    tasks: number;
    attendance: number;
    pipeline: number;
    clients: number;
  };
  meta?: {
    tasksDone: number;
    tasksTotal: number;
    presentToday: number;
    staffTotal: number;
    activeClients: number;
  };
}

// ── Revenue ─────────────────────────────────────────────────────────────────

export interface MonthlyRevenue {
  id?: string;
  year: number;
  month: number;
  totalRevenueUsd: number;
  totalExpensesUsd: number | null;
}

export interface RevenueMonth {
  month: string;
  monthNum: number;
  year: number;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface RevenueData {
  data: MonthlyRevenue[];
  summary: {
    totalRevenue: number;
    totalExpenses: number | null;
    netProfit: number;
    avgMonthly?: number;
  };
}

// ── Staff Stats ─────────────────────────────────────────────────────────────

export interface TopRatedStaff {
  id: string;
  name: string;
  branch: string | null;
  averageTaskRating: number | null;
  tasksCompleted: number;
}

export interface StaffStats {
  total: number;
  active: number;
  onLeave: number;
  newThisMonth?: number;
  /** Optional; dashboard Staff Overview does not render this today */
  topRated?: TopRatedStaff[];
}

// ── Client Stats ────────────────────────────────────────────────────────────

export interface TopSpender {
  id: string;
  fullName: string;
  country: string | null;
  totalSpent: number;
  totalOrders: number;
}

export interface ClientStats {
  total: number;
  active: number;
  newThisMonth: number;
  totalSpent?: number;
  topSpenders: TopSpender[];
}

// ── Leaderboard ─────────────────────────────────────────────────────────────

export interface StaffLeaderboardEntry {
  id: string;
  name: string;
  branch: string | null;
  systemRole: string;
  tasksCompleted: number;
  averageTaskRating: number | null;
}

export interface ReferrerLeaderboardEntry {
  id: string;
  fullName: string;
  country: string | null;
  totalReferrals: number;
  totalCommissionEarned: number;
}

export interface Leaderboard {
  staff: StaffLeaderboardEntry[];
  referrers: ReferrerLeaderboardEntry[];
}

// ── Forecast ────────────────────────────────────────────────────────────────

export interface ForecastMonth {
  month: string;
  year: number;
  projected: number;
  low: number;
  high: number;
  expenses?: number;
  profit?: number;
}

export interface ForecastData {
  forecast: ForecastMonth[];
  basis: {
    months: number;
    avgRevenue: number;
    avgExpenses?: number;
    avgGrowth?: number;
  } | null;
}

// ── Task Stats ──────────────────────────────────────────────────────────────

export interface TaskStats {
  total: number;
  done: number;
  inProgress: number;
  pending: number;
  overdue: number;
  completionRate: number;
  thisMonth: number;
  trend: Trend;
}

// ── Activities ──────────────────────────────────────────────────────────────

export type ActivityType = 'task' | 'attendance' | 'lead' | 'order';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  subtitle?: string;
  status: string;
  value?: number;
  /** ISO date string from API */
  time: string;
}

export interface ActivitiesData {
  activities: Activity[];
}

// ── Dashboard Summary (Consolidated) ────────────────────────────────────────

export interface DashboardKPIs {
  revenue: {
    value: number;
    trend: Trend;
    label: string;
  };
  profit: {
    value: number;
    expenses: number;
  };
  staff: {
    total: number;
    active: number;
    onLeave: number;
    newThisMonth: number;
    trend: Trend;
  };
  attendance: {
    presentToday: number;
    staffTotal: number;
    percentage: number;
    trend: Trend;
  };
  clients: {
    total: number;
    active: number;
    newThisMonth: number;
    trend: Trend;
  };
  tasks: {
    total: number;
    done: number;
    inProgress: number;
    pending: number;
    completionRate: number;
  };
  pipeline: {
    won: number;
    total: number;
    winRate: number;
  };
}

export interface DashboardSummary {
  health: {
    total: number;
    breakdown: {
      tasks: number;
      attendance: number;
      pipeline: number;
      clients: number;
    };
  };
  kpis: DashboardKPIs;
  revenue: {
    data: RevenueMonth[];
    summary: {
      totalRevenue: number;
      totalExpenses: number;
      netProfit: number;
      avgMonthly: number;
    };
  };
  activities: {
    tasks: Activity[];
    attendance: Activity[];
    leads: Activity[];
  };
  leaderboards: {
    staff: StaffLeaderboardEntry[];
    clients: TopSpender[];
    referrers: ReferrerLeaderboardEntry[];
  };
  generatedAt: string;
}
