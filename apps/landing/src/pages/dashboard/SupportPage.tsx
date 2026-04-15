import { useState } from "react";
import { Link } from "react-router-dom";
import { useSupportTickets, useCreateSupportTicket } from "@/api/portal-dashboard";
import { paths } from "@/routes/paths";
import { formatDate } from "@/lib/format";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";

export default function SupportPage() {
  const tickets = useSupportTickets(1, 50);
  const create = useCreateSupportTicket();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("Medium");

  const submit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    try {
      await create.mutateAsync({
        subject: subject.trim(),
        message: message.trim(),
        priority,
      });
      toast.success("Ticket created");
      setSubject("");
      setMessage("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create ticket");
    }
  };

  return (
    <div className="space-y-6">
      <DashboardPanel
        title="New ticket"
        description="Describe your issue — our team will respond in the thread."
      >
        <div className="grid w-full max-w-2xl gap-4">
          <div>
            <label htmlFor="ticket-subject" className="text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
            <input
              id="ticket-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="ticket-priority" className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
            <select
              id="ticket-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2.5 text-sm"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div>
            <label htmlFor="ticket-message" className="text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
            <textarea
              id="ticket-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="mt-1 min-h-[7rem] w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2.5 text-sm"
            />
          </div>
          <Button
            type="button"
            className="w-full touch-manipulation sm:w-auto"
            disabled={create.isPending}
            onClick={() => void submit()}
          >
            {create.isPending ? "Sending…" : "Submit ticket"}
          </Button>
        </div>
      </DashboardPanel>

      <DashboardPanel title="Your tickets">
        {tickets.isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        ) : tickets.isError ? (
          <p className="text-sm text-red-600">Failed to load tickets.</p>
        ) : !tickets.data?.items.length ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No tickets yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {tickets.data.items.map((t) => (
              <li
                key={t.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    to={paths.dashboardSupportTicket(t.id)}
                    className="font-medium text-primary-700 hover:underline"
                  >
                    {t.subject}
                  </Link>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(t.createdAt)} · {t.priority}
                  </p>
                </div>
                <Badge className="w-fit shrink-0" variant="sky">
                  {t.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </DashboardPanel>
    </div>
  );
}
