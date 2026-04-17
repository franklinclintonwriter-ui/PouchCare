import { useMemo } from "react";
import { Trophy, Star, CheckSquare, Users, TrendingUp } from "lucide-react";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import { useStaffLeaderboard } from "@/api/staff";
import { PageTransition } from "@/components/ui/PageTransition";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StatsRow } from "@/components/shared/StatsRow";
import { Card } from "@/components/ui/Card";

type LeaderboardRow = {
  id: string;
  name: string;
  branch: string | null;
  primarySkill: string | null;
  averageTaskRating: number | null;
  tasksCompleted: number;
  systemRole: string;
};

const MEDAL_COLORS: Record<number, string> = {
  1: "bg-amber-100 text-amber-700 ring-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-700",
  2: "bg-gray-100 text-gray-600 ring-gray-300 dark:bg-gray-700/50 dark:text-gray-300 dark:ring-gray-600",
  3: "bg-orange-100 text-orange-700 ring-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:ring-orange-700",
};

const MEDAL_EMOJI: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <span
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ring-1 ${MEDAL_COLORS[rank]}`}
      >
        {MEDAL_EMOJI[rank]}
      </span>
    );
  }
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-gray-500 dark:text-gray-400">
      {rank}
    </span>
  );
}

export default function StaffLeaderboard() {
  const { data = [], isLoading } = useStaffLeaderboard();

  const headerConfig = useMemo(
    () => ({
      title: "Shoulder Leaderboard",
      breadcrumbs: [
        { label: "Shoulder", href: "/staff" },
        { label: "Leaderboard", icon: Trophy },
      ],
      actions: [],
    }),
    [],
  );

  useHeaderConfig(headerConfig);

  const stats = useMemo(() => {
    const totalStaff = data.length;
    const totalTasks = data.reduce((s, r) => s + r.tasksCompleted, 0);
    const rated = data.filter(
      (r) => r.averageTaskRating != null && r.averageTaskRating > 0,
    );
    const avgRating =
      rated.length > 0
        ? (
            rated.reduce((s, r) => s + (r.averageTaskRating ?? 0), 0) /
            rated.length
          ).toFixed(1)
        : "—";
    const topPerformer = data.length > 0 ? (data[0]?.name ?? "—") : "—";
    return [
      {
        title: "Ranked Staff",
        value: totalStaff,
        icon: <Users />,
        iconBg:
          "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      },
      {
        title: "Avg Rating",
        value: avgRating,
        icon: <Star />,
        iconBg:
          "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
      },
      {
        title: "Total Tasks",
        value: totalTasks,
        icon: <CheckSquare />,
        iconBg:
          "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
      },
      {
        title: "Top Performer",
        value: topPerformer,
        icon: <Trophy />,
        iconBg:
          "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      },
    ];
  }, [data]);

  const columns: Column<LeaderboardRow>[] = [
    {
      key: "rank" as keyof LeaderboardRow,
      label: "#",
      width: "60px",
      render: (_row, _col, index) => <RankBadge rank={(index ?? 0) + 1} />,
    },
    {
      key: "name",
      label: "Shoulder",
      sticky: true,
      render: (row, _col, index) => (
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar name={row.name} size="sm" />
            {(index ?? 0) < 3 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-[8px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                ★
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {row.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {row.systemRole.replace(/_/g, " ")}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "averageTaskRating",
      label: "Avg Rating",
      align: "center",
      render: (row) => {
        const rating = row.averageTaskRating;
        if (rating == null) return <span className="text-gray-400">—</span>;
        const variant =
          rating >= 8 ? "success" : rating >= 5 ? "warning" : "danger";
        return (
          <div className="flex items-center justify-center gap-1.5">
            <Badge variant={variant} size="sm">
              {rating.toFixed(1)}
            </Badge>
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < Math.round(rating / 2) ? "fill-amber-400 text-amber-400" : "text-gray-200 dark:text-gray-700"}`}
                />
              ))}
            </div>
          </div>
        );
      },
    },
    {
      key: "tasksCompleted",
      label: "Tasks Completed",
      align: "center",
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 font-semibold text-gray-800 dark:text-gray-200">
          <CheckSquare className="h-3.5 w-3.5 text-gray-400" />
          {row.tasksCompleted}
        </span>
      ),
    },
    {
      key: "primarySkill",
      label: "Primary Skill",
      render: (row) =>
        row.primarySkill ? (
          <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            {row.primarySkill}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "branch",
      label: "Branch",
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.branch ?? "—"}
        </span>
      ),
    },
  ];

  // Top 3 podium for non-loading states with data
  const showPodium = !isLoading && data.length >= 3;

  return (
    <PageTransition>
      <div className="space-y-6">
        <StatsRow items={stats} loading={isLoading} />

        {showPodium && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[1, 0, 2].map((idx) => {
              const row = data[idx];
              if (!row) return null;
              const rank = idx + 1;
              const isFirst = rank === 1;
              return (
                <Card
                  key={row.id}
                  padding="md"
                  className={`text-center ${isFirst ? "ring-2 ring-amber-300/60 dark:ring-amber-600/40 sm:-mt-2" : ""}`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">{MEDAL_EMOJI[rank]}</span>
                    <Avatar name={row.name} size={isFirst ? "lg" : "md"} />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                        {row.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {row.branch ?? row.systemRole.replace(/_/g, " ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                        {row.averageTaskRating?.toFixed(1) ?? "—"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {row.tasksCompleted} tasks
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          getRowId={(row) => row.id}
          emptyTitle="No leaderboard data"
          emptyDescription="Leaderboard data will populate as staff complete tasks and receive ratings."
        />
      </div>
    </PageTransition>
  );
}
