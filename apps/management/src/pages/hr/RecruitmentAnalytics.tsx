import { useMemo } from "react";
import { BarChart, Users, TrendingUp, Target, Clock, Zap } from "lucide-react";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import { useRecruitmentMetrics, useApplicationsBySource } from "@/api/hr";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatsRow } from "@/components/shared/StatsRow";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Skeleton } from "@/components/ui/Skeleton";
import { usePermission } from "@/hooks/usePermission";

export default function RecruitmentAnalytics() {
  const perm = usePermission();
  const { data: metrics, isLoading: metricsLoading } = useRecruitmentMetrics();
  const { data: sourceAnalytics, isLoading: sourceLoading } =
    useApplicationsBySource();

  const headerConfig = useMemo(
    () => ({
      title: "Recruitment Analytics",
      breadcrumbs: [
        { label: "HR", href: "/hr" },
        { label: "Analytics", icon: BarChart },
      ],
    }),
    [],
  );
  useHeaderConfig(headerConfig);

  if (metricsLoading || sourceLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-80" />
        </div>
      </PageTransition>
    );
  }

  if (!metrics) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center gap-4 py-16">
          <p className="text-gray-500">No recruitment data available</p>
        </div>
      </PageTransition>
    );
  }

  const keyMetrics = [
    {
      title: "Total Positions",
      value: metrics.totalPositions,
      icon: <Target />,
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      title: "Open Positions",
      value: metrics.openPositions,
      icon: <Zap />,
      iconBg:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      title: "Total Applications",
      value: metrics.totalApplications,
      icon: <Users />,
      iconBg:
        "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    },
    {
      title: "Conversion Rate",
      value: `${metrics.metrics.conversionRate}%`,
      icon: <TrendingUp />,
      iconBg:
        "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      title: "Avg Time to Hire",
      value: `${metrics.metrics.avgTimeToHire} days`,
      icon: <Clock />,
      iconBg: "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
    },
    {
      title: "Avg Apps Per Position",
      value: metrics.metrics.avgApplicationsPerPosition,
      icon: <BarChart />,
      iconBg:
        "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
    },
  ];

  type StageData = {
    stage: string;
    count: number;
    percentage: string;
  };

  const stageData: StageData[] = [
    {
      stage: "New",
      count: metrics.stageBreakdown.new,
      percentage: (
        (metrics.stageBreakdown.new / metrics.totalApplications) *
        100
      ).toFixed(1),
    },
    {
      stage: "Screening",
      count: metrics.stageBreakdown.screening,
      percentage: (
        (metrics.stageBreakdown.screening / metrics.totalApplications) *
        100
      ).toFixed(1),
    },
    {
      stage: "Interview",
      count: metrics.stageBreakdown.interview,
      percentage: (
        (metrics.stageBreakdown.interview / metrics.totalApplications) *
        100
      ).toFixed(1),
    },
    {
      stage: "Offer",
      count: metrics.stageBreakdown.offer,
      percentage: (
        (metrics.stageBreakdown.offer / metrics.totalApplications) *
        100
      ).toFixed(1),
    },
    {
      stage: "Hired",
      count: metrics.stageBreakdown.hired,
      percentage: (
        (metrics.stageBreakdown.hired / metrics.totalApplications) *
        100
      ).toFixed(1),
    },
    {
      stage: "Rejected",
      count: metrics.stageBreakdown.rejected,
      percentage: (
        (metrics.stageBreakdown.rejected / metrics.totalApplications) *
        100
      ).toFixed(1),
    },
  ];

  type SourceData = {
    source: string;
    total: number;
    hired: number;
    rejected: number;
    pending: number;
  };

  const sourceData: SourceData[] = Object.entries(sourceAnalytics || {}).map(
    ([source, stats]: any) => ({
      source,
      total: stats.total,
      hired: stats.hired,
      rejected: stats.rejected,
      pending: stats.pending,
    }),
  );

  const stageColumns: Column<StageData>[] = [
    {
      key: "stage",
      label: "Stage",
      render: (row) => <span className="font-medium">{row.stage}</span>,
    },
    {
      key: "count",
      label: "Count",
      align: "center",
      render: (row) => <span className="font-semibold">{row.count}</span>,
    },
    {
      key: "percentage",
      label: "Percentage",
      align: "center",
      render: (row) => (
        <span className="text-amber-600 font-medium">{row.percentage}%</span>
      ),
    },
  ];

  const sourceColumns: Column<SourceData>[] = [
    {
      key: "source",
      label: "Source",
      sticky: true,
      render: (row) => <span className="font-medium">{row.source}</span>,
    },
    {
      key: "total",
      label: "Total",
      align: "center",
      render: (row) => <span>{row.total}</span>,
    },
    {
      key: "hired",
      label: "Hired",
      align: "center",
      render: (row) => (
        <span className="text-emerald-600 font-medium">{row.hired}</span>
      ),
    },
    {
      key: "rejected",
      label: "Rejected",
      align: "center",
      render: (row) => (
        <span className="text-red-600 font-medium">{row.rejected}</span>
      ),
    },
    {
      key: "pending",
      label: "Pending",
      align: "center",
      render: (row) => (
        <span className="text-blue-600 font-medium">{row.pending}</span>
      ),
    },
  ];

  return (
    <PageTransition className="space-y-6">
      <StatsRow items={keyMetrics} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Stages</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={stageColumns}
              data={stageData}
              emptyTitle="No data"
              getRowId={(row) => row.stage}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Source Effectiveness</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceData.length > 0 ? (
              <DataTable
                columns={sourceColumns}
                data={sourceData}
                emptyTitle="No source data"
                getRowId={(row) => row.source}
              />
            ) : (
              <p className="text-sm text-gray-500">No source data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <div className="text-2xl">💡</div>
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Conversion Rate
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {metrics.metrics.conversionRate}% of all applications have
                  been successfully hired.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
              <div className="text-2xl">⏱️</div>
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  Hiring Timeline
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  On average, it takes {metrics.metrics.avgTimeToHire} days from
                  application to hire.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
              <div className="text-2xl">📊</div>
              <div>
                <p className="font-medium text-emerald-900 dark:text-emerald-100">
                  Application Volume
                </p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Each position receives an average of{" "}
                  {metrics.metrics.avgApplicationsPerPosition} applications.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
