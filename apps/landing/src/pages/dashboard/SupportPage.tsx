/**
 * Support — create + list tickets.
 * Route: /dashboard/support
 *
 * Migrated (Week 5) to the full UI-kit set:
 *   - New-ticket form: react-hook-form + Zod, FormField + Select (typed
 *     priority enum), Textarea with a maxLength counter (5,000 chars).
 *   - Minimum subject length (3 chars).
 *   - Ticket list: DataTable + Pagination + shared loading / error / empty.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { LifeBuoy } from "lucide-react";
import {
  useSupportTickets,
  useCreateSupportTicket,
} from "@/api/portal-dashboard";
import { paths } from "@/routes/paths";
import { formatDate } from "@/lib/format";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  FormField,
  Input,
  Select,
  Textarea,
  HelpText,
  DataTable,
  type DataTableColumn,
} from "@/components/ui";

const MESSAGE_MAX = 5000;
const PAGE_SIZE = 20;

const TicketPriorityEnum = z.enum(["Low", "Medium", "High"]);

const schema = z.object({
  subject: z
    .string()
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject is too long"),
  priority: TicketPriorityEnum,
  message: z
    .string()
    .min(1, "Add a description of your issue")
    .max(MESSAGE_MAX, `Message is too long (max ${MESSAGE_MAX.toLocaleString()} chars)`),
});

type FormValues = z.infer<typeof schema>;

interface TicketRow {
  id: string;
  subject: string;
  priority: string;
  status: string;
  createdAt: string;
}

export default function SupportPage() {
  const [page, setPage] = useState(1);
  const ticketsQuery = useSupportTickets(page, PAGE_SIZE);
  const create = useCreateSupportTicket();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { subject: "", priority: "Medium", message: "" },
    mode: "onBlur",
  });

  const message = watch("message") ?? "";

  const onSubmit = async (values: FormValues) => {
    try {
      await create.mutateAsync({
        subject: values.subject.trim(),
        message: values.message.trim(),
        priority: values.priority,
      });
      toast.success("Ticket created");
      reset({ subject: "", priority: "Medium", message: "" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create ticket");
    }
  };

  const columns: DataTableColumn<TicketRow>[] = [
    {
      key: "subject",
      header: "Subject",
      cell: (t) => (
        <Link
          to={paths.dashboardSupportTicket(t.id)}
          className="font-medium text-primary-700 hover:underline"
        >
          {t.subject}
        </Link>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      cell: (t) => <span className="text-sm">{t.priority}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (t) => <Badge variant="sky">{t.status}</Badge>,
    },
    {
      key: "createdAt",
      header: "Created",
      cell: (t) => (
        <span className="tabular-nums text-xs text-gray-500 dark:text-gray-400">
          {formatDate(t.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardPanel
        title="New ticket"
        description="Describe your issue — our team will respond in the thread."
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid w-full max-w-2xl gap-4"
          noValidate
        >
          <FormField label="Subject" required error={errors.subject?.message}>
            {({
              id,
              "aria-describedby": desc,
              "aria-invalid": inv,
              "aria-required": req,
            }) => (
              <Input
                id={id}
                aria-describedby={desc}
                aria-invalid={inv}
                aria-required={req}
                placeholder="Short summary of your issue"
                error={!!errors.subject}
                {...register("subject")}
              />
            )}
          </FormField>

          <FormField
            label="Priority"
            required
            error={errors.priority?.message}
            help={
              <HelpText>
                High-priority tickets are reviewed within 2 business hours.
              </HelpText>
            }
          >
            {({
              id,
              "aria-describedby": desc,
              "aria-invalid": inv,
              "aria-required": req,
            }) => (
              <Select
                id={id}
                aria-describedby={desc}
                aria-invalid={inv}
                aria-required={req}
                error={!!errors.priority}
                {...register("priority")}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </Select>
            )}
          </FormField>

          <FormField
            label="Message"
            required
            error={errors.message?.message}
            help={
              <span className="flex items-center gap-2">
                <HelpText>
                  Include steps to reproduce, screenshots, and order IDs if relevant.
                </HelpText>
                <span
                  className={`ml-auto text-[11px] tabular-nums ${
                    message.length > MESSAGE_MAX - 200
                      ? "text-amber-600"
                      : "text-gray-400"
                  }`}
                >
                  {message.length.toLocaleString()} / {MESSAGE_MAX.toLocaleString()}
                </span>
              </span>
            }
          >
            {({
              id,
              "aria-describedby": desc,
              "aria-invalid": inv,
              "aria-required": req,
            }) => (
              <Textarea
                id={id}
                rows={5}
                maxLength={MESSAGE_MAX}
                aria-describedby={desc}
                aria-invalid={inv}
                aria-required={req}
                error={!!errors.message}
                placeholder="Tell us what happened…"
                {...register("message")}
              />
            )}
          </FormField>

          <div>
            <Button
              type="submit"
              className="w-full touch-manipulation sm:w-auto"
              disabled={isSubmitting || create.isPending}
            >
              {create.isPending ? "Sending…" : "Submit ticket"}
            </Button>
          </div>
        </form>
      </DashboardPanel>

      <DashboardPanel title="Your tickets">
        <DataTable<TicketRow>
          columns={columns}
          data={(ticketsQuery.data?.items ?? []) as TicketRow[]}
          getRowId={(t) => t.id}
          isLoading={ticketsQuery.isLoading}
          isError={ticketsQuery.isError}
          error={ticketsQuery.error}
          onRetry={() => ticketsQuery.refetch()}
          empty={{
            icon: <LifeBuoy />,
            title: "No tickets yet",
            description:
              "When you open a ticket, it'll appear here so you can track replies.",
          }}
          pagination={{
            page,
            pageSize: PAGE_SIZE,
            total: ticketsQuery.data?.meta?.total ?? 0,
            onChange: setPage,
          }}
        />
      </DashboardPanel>
    </div>
  );
}
