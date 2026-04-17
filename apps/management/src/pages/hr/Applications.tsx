import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserCheck,
  Star,
  Plus,
  Users,
  ClipboardList,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import {
  useApplications,
  useUpdateApplication,
  useCreateApplication,
  usePositions,
  useRecruitmentMetrics,
} from "@/api/hr";
import {
  STAGE_TRANSITIONS,
  STAGE_LABELS,
  STATUS_MAP,
} from "@/constants/recruitment";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatsRow } from "@/components/shared/StatsRow";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PageTransition } from "@/components/ui/PageTransition";
import { usePermission } from "@/hooks/usePermission";
import type { JobApplication } from "@/types/models";
import { toast } from "sonner";

const stageTabs = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Screening", value: "screening" },
  { label: "Interview", value: "interview" },
  { label: "Offer", value: "offer" },
  { label: "Hired", value: "hired" },
  { label: "Rejected", value: "rejected" },
];


function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "text-gray-200 dark:text-gray-600"
          }`}
        />
      ))}
    </div>
  );
}

export default function Applications() {
  const navigate = useNavigate();
  const [stage, setStage] = useState("all");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const perm = usePermission();
  const updateApplication = useUpdateApplication();
  const createApplication = useCreateApplication();
  const { data: positions } = usePositions();

  const [form, setForm] = useState({
    positionId: "",
    applicantName: "",
    email: "",
    phone: "",
    cvUrl: "",
    portfolioUrl: "",
    experienceYears: "",
    expectedSalary: "",
    source: "",
    notes: "",
  });

  const params = useMemo(
    () => ({
      status: stage === "all" ? undefined : stage,
      page,
      limit: 20,
    }),
    [stage, page],
  );

  const { data, isLoading } = useApplications(params);
  const applications = data?.data ?? [];

  const { data: metrics } = useRecruitmentMetrics();

  const pipelineStats = useMemo(() => {
    const sb = metrics?.stageBreakdown;
    const total = metrics?.totalApplications ?? 0;
    const inPipeline =
      (sb?.new ?? 0) +
      (sb?.screening ?? 0) +
      (sb?.interview ?? 0) +
      (sb?.offer ?? 0);
    const interviewing = (sb?.interview ?? 0) + (sb?.offer ?? 0);
    const hired = sb?.hired ?? 0;
    return [
      {
        title: "Total Applicants",
        value: total,
        icon: <Users />,
        iconBg:
          "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      },
      {
        title: "In Pipeline",
        value: inPipeline,
        icon: <ClipboardList />,
        iconBg:
          "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      },
      {
        title: "Interviewing",
        value: interviewing,
        icon: <Briefcase />,
        iconBg:
          "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
      },
      {
        title: "Hired",
        value: hired,
        icon: <CheckCircle2 />,
        iconBg:
          "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
      },
    ];
  }, [metrics]);

  const openPositions = useMemo(
    () => (positions ?? []).filter((p) => p.status === "open"),
    [positions],
  );

  const canCreate = perm.can("hr.recruitment");

  const headerConfig = useMemo(
    () => ({
      title: "Applications",
      breadcrumbs: [
        { label: "HR", href: "/hr" },
        { label: "Applications", icon: UserCheck },
      ],
      actions: canCreate
        ? [
            {
              type: "button" as const,
              label: "Add Application",
              icon: Plus,
              onClick: () => setShowCreate(true),
            },
          ]
        : [],
    }),
    [canCreate],
  );
  useHeaderConfig(headerConfig);

  const handleCreate = async () => {
    if (!form.positionId || !form.applicantName || !form.email) {
      toast.error("Position, name, and email are required");
      return;
    }
    try {
      await createApplication.mutateAsync({
        positionId: form.positionId,
        applicantName: form.applicantName,
        email: form.email,
        phone: form.phone || undefined,
        cvUrl: form.cvUrl || undefined,
        portfolioUrl: form.portfolioUrl || undefined,
        experienceYears: form.experienceYears
          ? Number(form.experienceYears)
          : undefined,
        expectedSalary: form.expectedSalary
          ? Number(form.expectedSalary)
          : undefined,
        source: form.source || undefined,
        notes: form.notes || undefined,
      });
      toast.success("Application added");
      setShowCreate(false);
      setForm({
        positionId: "",
        applicantName: "",
        email: "",
        phone: "",
        cvUrl: "",
        portfolioUrl: "",
        experienceYears: "",
        expectedSalary: "",
        source: "",
        notes: "",
      });
    } catch {
      toast.error("Failed to add application");
    }
  };

  const handleStageChange = async (
    row: JobApplication,
    newStage: JobApplication["stage"],
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    try {
      await updateApplication.mutateAsync({
        id: row.id,
        status: STATUS_MAP[newStage] ?? newStage,
      });
      toast.success(`Application moved to ${STAGE_LABELS[newStage]}`);
    } catch {
      toast.error("Failed to update application status");
    }
  };

  const columns: Column<JobApplication>[] = [
    {
      key: "applicantName",
      label: "Applicant",
      sticky: true,
      render: (row) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {row.applicantName}
        </span>
      ),
    },
    { key: "positionTitle", label: "Position" },
    {
      key: "source",
      label: "Source",
      render: (row) =>
        row.source ? (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {row.source}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "stage",
      label: "Stage",
      render: (row) => <StatusBadge status={row.stage} />,
    },
    {
      key: "rating",
      label: "Rating",
      render: (row) => <StarRating rating={row.rating} />,
    },
    {
      key: "appliedDate",
      label: "Applied",
      render: (row) => (
        <span className="text-gray-500 dark:text-gray-400">
          {new Date(row.appliedDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })}
        </span>
      ),
    },
    ...(perm.can("hr.recruitment")
      ? [
          {
            key: "actions" as keyof JobApplication,
            label: "Actions",
            render: (row: JobApplication) => {
              const transitions = STAGE_TRANSITIONS[row.stage] ?? [];
              if (transitions.length === 0) return null;
              return (
                <div className="flex gap-1">
                  {transitions.map((nextStage) => (
                    <Button
                      key={nextStage}
                      size="sm"
                      variant={nextStage === "rejected" ? "ghost" : "outline"}
                      isLoading={updateApplication.isPending}
                      onClick={(e) => handleStageChange(row, nextStage, e)}
                    >
                      {STAGE_LABELS[nextStage]}
                    </Button>
                  ))}
                </div>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <PageTransition className="space-y-6">
      <StatsRow items={pipelineStats} loading={isLoading} />

      <div className="overflow-x-auto">
        <Tabs
          tabs={stageTabs}
          value={stage}
          onChange={(v) => {
            setStage(v);
            setPage(1);
          }}
        />
      </div>

      <DataTable
        columns={columns}
        data={applications}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        pagination={data?.meta}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`/hr/applications/${row.id}`)}
        emptyTitle="No applications found"
        emptyDescription="Add an application to start tracking candidates."
      />

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add Application"
        description="Add a new job application to the pipeline"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              isLoading={createApplication.isPending}
              onClick={handleCreate}
            >
              Add Application
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Position *"
            value={form.positionId}
            onChange={(e) =>
              setForm((f) => ({ ...f, positionId: e.target.value }))
            }
            options={[
              { label: "Select position...", value: "" },
              ...openPositions.map((p) => ({ label: p.title, value: p.id })),
            ]}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Applicant Name *"
              value={form.applicantName}
              onChange={(e) =>
                setForm((f) => ({ ...f, applicantName: e.target.value }))
              }
            />
            <Input
              label="Email *"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
            <Select
              label="Source"
              value={form.source}
              onChange={(e) =>
                setForm((f) => ({ ...f, source: e.target.value }))
              }
              options={[
                { label: "— Select —", value: "" },
                { label: "LinkedIn", value: "LinkedIn" },
                { label: "Referral", value: "Referral" },
                { label: "Job Board", value: "Job Board" },
                { label: "Company Website", value: "Company Website" },
                { label: "Social Media", value: "Social Media" },
                { label: "Recruitment Agency", value: "Recruitment Agency" },
                { label: "Other", value: "Other" },
              ]}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="CV URL"
              type="url"
              placeholder="https://..."
              value={form.cvUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, cvUrl: e.target.value }))
              }
            />
            <Input
              label="Portfolio URL"
              type="url"
              placeholder="https://..."
              value={form.portfolioUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, portfolioUrl: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Years of Experience"
              type="number"
              min="0"
              value={form.experienceYears}
              onChange={(e) =>
                setForm((f) => ({ ...f, experienceYears: e.target.value }))
              }
            />
            <Input
              label="Expected Salary (USD)"
              type="number"
              min="0"
              value={form.expectedSalary}
              onChange={(e) =>
                setForm((f) => ({ ...f, expectedSalary: e.target.value }))
              }
            />
          </div>
          <Textarea
            label="Notes"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>
      </Modal>
    </PageTransition>
  );
}
