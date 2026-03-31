export interface HealthScore {
  total: number;
  breakdown: {
    tasks: number;
    attendance: number;
    pipeline: number;
    clients: number;
  };
  meta: {
    tasksDone: number;
    tasksTotal: number;
    presentToday: number;
    staffTotal: number;
    activeClients: number;
  };
}

export interface MonthlyRevenue {
  id: string;
  year: number;
  month: number;
  totalRevenueUsd: number;
  totalExpensesUsd: number | null;
}

export interface RevenueData {
  data: MonthlyRevenue[];
  summary: {
    totalRevenue: number;
    totalExpenses: number | null;
    netProfit: number;
  };
}

export interface StaffStats {
  total: number;
  active: number;
  onLeave: number;
  topRated: {
    id: string;
    name: string;
    branch: string;
    averageTaskRating: number;
    tasksCompleted: number;
  }[];
}

export interface ClientStats {
  total: number;
  active: number;
  newThisMonth: number;
  topSpenders: {
    id: string;
    fullName: string;
    country: string | null;
    totalSpent: number;
    totalOrders: number;
  }[];
}

export interface Leaderboard {
  staff: {
    id: string;
    name: string;
    branch: string;
    systemRole: string;
    tasksCompleted: number;
    averageTaskRating: number;
  }[];
  referrers: {
    id: string;
    fullName: string;
    country: string | null;
    totalReferrals: number;
    totalCommissionEarned: number;
  }[];
}

export interface ForecastMonth {
  month: string;
  year: number;
  projected: number;
  low: number;
  high: number;
}

export interface ForecastData {
  forecast: ForecastMonth[];
  basis: {
    months: number;
    avgRevenue: number;
  };
}
