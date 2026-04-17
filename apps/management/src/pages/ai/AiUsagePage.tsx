import { useMemo } from "react";
import { BarChart3, ArrowUpRight, ArrowDownRight, Zap } from "lucide-react";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { ToolPageChrome } from "@/features/tools/components/ToolPageChrome";
import { AiUsageBar } from "@/features/ai/components/AiUsageBar";
import { AiProviderBadge } from "@/features/ai/components/AiProviderBadge";
import { useAiUsage } from "@/api/ai";
import type { AiUsageBreakdown } from "@/features/ai/types";

const USE_CASE_LABELS: Record<string, string> = {
  BLOG: "Blog Writer",
  SEO_BRIEF: "SEO Brief",
  TASK: "Task Planner",
  REPORT: "Report Drafter",
  CHAT: "Chat",
};

export default function AiUsagePage() {
  const { data: usage } = useAiUsage();

  useHeaderConfig({
    title: "AI Usage",
    breadcrumbs: [{ label: "AI", href: "/ai" }, { label: "Usage" }],
    actions: [],
  });

  const pct =
    usage && usage.limit > 0
      ? Math.round((usage.totalTokens / usage.limit) * 100)
      : 0;

  const stats = useMemo(() => {
    if (!usage) return [];
    return [
      {
        title: "Input tokens",
        value: usage.totalInput.toLocaleString(),
        icon: <ArrowUpRight />,
        iconBg: "bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
      },
      {
        title: "Output tokens",
        value: usage.totalOutput.toLocaleString(),
        icon: <ArrowDownRight />,
        iconBg:
          "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
      },
      {
        title: "Total tokens",
        value: usage.totalTokens.toLocaleString(),
        icon: <Zap />,
        iconBg:
          "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
      },
      {
        title: "Budget used",
        value: usage.limit > 0 ? `${pct}%` : "Unlimited",
        icon: <BarChart3 />,
        iconBg:
          pct > 80
            ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            : "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
      },
    ];
  }, [usage, pct]);

  const columns: Column<AiUsageBreakdown>[] = useMemo(
    () => [
      {
        key: "provider",
        label: "Provider / Model",
        render: (r) => (
          <AiProviderBadge provider={r.provider} model={r.model} />
        ),
      },
      {
        key: "useCase",
        label: "Feature",
        render: (r) => (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {USE_CASE_LABELS[r.useCase] ?? r.useCase}
          </span>
        ),
      },
      {
        key: "input",
        label: "Input",
        render: (r) => (
          <span className="font-mono text-xs">
            {r.inputTokens.toLocaleString()}
          </span>
        ),
      },
      {
        key: "output",
        label: "Output",
        render: (r) => (
          <span className="font-mono text-xs">
            {r.outputTokens.toLocaleString()}
          </span>
        ),
      },
      {
        key: "total",
        label: "Total",
        render: (r) => (
          <span className="font-mono text-xs font-medium">
            {(r.inputTokens + r.outputTokens).toLocaleString()}
          </span>
        ),
      },
      {
        key: "requests",
        label: "Requests",
        render: (r) => <span className="font-mono text-xs">{r.requests}</span>,
      },
    ],
    [],
  );

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl space-y-5 px-4 pb-10 pt-1 sm:px-6 lg:px-8">
        <ToolPageChrome
          accent="slate"
          eyebrow="AI Analytics"
          title="Token usage & budget"
          hint={usage ? `Reporting period: ${usage.month}` : "Loading..."}
        />

        {usage && (
          <>
            {/* Budget bar */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Monthly budget
                  </h3>
                  {usage.remaining !== null && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {usage.remaining.toLocaleString()} remaining
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <AiUsageBar used={usage.totalTokens} limit={usage.limit} />
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((s) => (
                <Card key={s.title}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.iconBg}`}
                    >
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {s.title}
                      </p>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-50">
                        {s.value}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Breakdown table */}
            {usage.breakdown.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Detailed breakdown</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <DataTable
                    columns={columns}
                    data={usage.breakdown}
                    compact
                    emptyTitle="No usage"
                    emptyDescription="AI usage will appear here after your first request."
                  />
                </CardContent>
              </Card>
            )}

            {usage.breakdown.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-12 text-center dark:border-gray-700">
                <BarChart3 className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                <p className="mt-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                  No usage this month
                </p>
                <p className="mt-1 max-w-xs text-xs text-gray-500 dark:text-gray-400">
                  Start using AI tools to see token consumption, provider
                  breakdown, and budget tracking here.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
