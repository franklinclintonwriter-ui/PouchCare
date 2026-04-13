import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSupportTicket, useReplySupportTicket } from "@/api/portal-dashboard";
import { paths } from "@/routes/paths";
import { formatDate } from "@/lib/format";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";

export default function SupportTicketPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const q = useSupportTicket(ticketId);
  const reply = useReplySupportTicket(ticketId ?? "");
  const [text, setText] = useState("");

  const t = q.data;

  const send = async () => {
    if (!text.trim() || !ticketId) return;
    try {
      await reply.mutateAsync(text.trim());
      setText("");
      toast.success("Reply sent");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send");
    }
  };

  return (
    <div className="space-y-6">
      <Link
        to={paths.dashboardSupport}
        className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-1 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        All tickets
      </Link>

      {q.isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : q.isError || !t ? (
        <p className="text-sm text-red-600">Ticket not found.</p>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                {t.subject}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {formatDate(t.createdAt)} · {t.priority}
              </p>
            </div>
            <Badge className="w-fit shrink-0" variant="sky">
              {t.status}
            </Badge>
          </div>

          <DashboardPanel title="Conversation">
            <div className="max-h-[480px] space-y-3 overflow-y-auto">
              {(t.replies ?? []).map((r) => (
                <div
                  key={r.id}
                  className={`rounded-xl border p-3 text-sm ${
                    r.authorType === "staff"
                      ? "border-primary-200 bg-primary-50/50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <p className="text-xs font-medium text-gray-500">
                    {r.authorName} · {formatDate(r.createdAt)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-gray-800">
                    {r.content}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a reply…"
                rows={3}
                className="min-h-[5.5rem] flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm"
              />
              <Button
                type="button"
                className="w-full touch-manipulation sm:w-auto sm:min-w-[7rem] sm:self-stretch"
                disabled={reply.isPending}
                onClick={() => void send()}
              >
                {reply.isPending ? "Sending…" : "Send reply"}
              </Button>
            </div>
          </DashboardPanel>
        </>
      )}
    </div>
  );
}
