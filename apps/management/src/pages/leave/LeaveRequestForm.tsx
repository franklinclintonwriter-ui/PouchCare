import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import { useApplyLeave } from "@/api/leave";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CalendarOff, Info, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const LEAVE_TYPES = [
  {
    value: "ANNUAL",
    label: "Annual Leave",
    description: "Planned time off for vacation or personal use",
  },
  {
    value: "SICK",
    label: "Sick Leave",
    description: "Medical illness or health-related absence",
  },
  {
    value: "EMERGENCY",
    label: "Emergency Leave",
    description: "Urgent unforeseen circumstances",
  },
  {
    value: "MATERNITY",
    label: "Maternity Leave",
    description: "Maternity / pregnancy-related leave",
  },
  {
    value: "PATERNITY",
    label: "Paternity Leave",
    description: "Paternity leave for new fathers",
  },
  { value: "UNPAID", label: "Unpaid Leave", description: "Leave without pay" },
];

export default function LeaveRequestForm() {
  const navigate = useNavigate();
  const apply = useApplyLeave();
  const [leaveType, setLeaveType] = useState("ANNUAL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  useHeaderConfig(
    useMemo(
      () => ({
        title: "Submit Leave Request",
        breadcrumbs: [
          { label: "Home", href: "/" },
          { label: "Leave", href: "/leave" },
          { label: "Request" },
        ],
        actions: [
          {
            type: "button" as const,
            label: "Back to Leave",
            icon: ArrowLeft,
            variant: "outline" as const,
            onClick: () => navigate("/leave"),
          },
        ],
      }),
      [navigate],
    ),
  );

  const selectedType = LEAVE_TYPES.find((t) => t.value === leaveType);

  const dayCount = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;
    return (
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
  }, [startDate, endDate]);

  const onSubmit = async () => {
    if (!startDate || !endDate)
      return toast.error("Start and end date are required");
    if (endDate < startDate)
      return toast.error("End date must be on or after start date");
    try {
      await apply.mutateAsync({
        leaveType,
        startDate,
        endDate,
        reason: reason || undefined,
      });
      toast.success("Leave request submitted successfully");
      navigate("/leave");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submit failed");
    }
  };

  return (
    <PageTransition className="mx-auto max-w-2xl space-y-6">
      {/* Policy Notice */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200/80 bg-blue-50/80 px-4 py-3 dark:border-blue-900/50 dark:bg-blue-950/30">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="text-sm text-blue-900 dark:text-blue-100">
          <p className="font-medium">Leave Policy</p>
          <p className="mt-0.5 text-blue-700 dark:text-blue-300">
            All leave requests require manager approval. Submit at least 3
            working days in advance for planned leave. Emergency and sick leave
            can be submitted retroactively.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarOff className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            Leave Request Details
          </CardTitle>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Fill in the details below. Your manager will be notified for
            approval.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Select
              label="Leave Type"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              options={LEAVE_TYPES.map((t) => ({
                value: t.value,
                label: t.label,
              }))}
            />
            {selectedType && (
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {selectedType.description}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {dayCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/50">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Duration:
              </span>
              <Badge variant="primary" size="sm">
                {dayCount} {dayCount === 1 ? "day" : "days"}
              </Badge>
            </div>
          )}

          <Textarea
            label="Reason (optional)"
            placeholder="Briefly describe the reason for your leave request..."
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-700/60">
            <Button variant="outline" onClick={() => navigate("/leave")}>
              Cancel
            </Button>
            <Button onClick={onSubmit} isLoading={apply.isPending}>
              Submit Request
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
