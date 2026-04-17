/**
 * Single support-ticket view.
 * Route: /dashboard/support/:ticketId
 *
 * Migrated (Week 9) to the shared UI kit: Spinner on load, ErrorState on
 * failure, ConfirmDialog on close, Textarea + char counter for replies,
 * per-row author avatars, and auto-scrolling message thread.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MessageSquare, Shield, User as UserIcon } from "lucide-react";
import {
  useSupportTicket,
  useReplySupportTicket,
  useCloseTicket,
} from "@/api/portal-dashboard";
import { paths } from "@/routes/paths";
import { formatDate } from "@/lib/format";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import {
  Badge,
  Button,
  ConfirmDialog,
  ErrorState,
  HelpText,
  Spinner,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

const MESSAGE_MAX = 5000;

export default function SupportTicketPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const q = useSupportTicket(ticketId);
  const reply = useReplySupportTicket(ticketId ?? "");
  const closeTicket = useCloseTicket();

  const [text, setText] = useState("");
  const [closeOpen, setCloseOpen] = useState(false);
  const threadRef = useRef<HTMLDivElement | null>(null);

  const t = q.data;
  const replies = t?.replies ?? [];

  // Auto-scroll to the bottom when a new reply arrives or the thread loads.
  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [replies.length]);

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

  const confirmClose = async () => {
    if (!ticketId) return;
    try {
      await closeTicket.mutateAsync(ticketId);
      toast.success("Ticket closed");
      q.refetch();
      setCloseOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to close ticket");
    }
  };

  return (
    <div className="space-y-6">
      <Link
        to={paths.dashboardSupport}
        className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <ArrowLeft className="h-4 w-4" />
        All tickets
      </Link>

      {q.isLoading ? (
        <div className="flex items-center gap-2 py-12 justify-center text-sm text-gray-500 dark:text-gray-400">
          <Spinner className="h-4 w-4" />
          <span>Loading ticket…</span>
        </div>
      ) : q.isError || !t ? (
        <ErrorState
          error={q.error}
          onRetry={() => q.refetch()}
          title="Ticket not found"
          description="This ticket may have been deleted or you may not have access."
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 sm:text-xl">
                {t.subject}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {formatDate(t.createdAt)} · {t.priority}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className="w-fit" variant="sky">
                {t.status}
              </Badge>
              {t.status !== "Closed" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-[36px]"
                  disabled={closeTicket.isPending}
                  onClick={() => setCloseOpen(true)}
                >
                  {closeTicket.isPending ? "Closing…" : "Close ticket"}
                </Button>
              )}
            </div>
          </div>

          <DashboardPanel title="Conversation">
            <div
              ref={threadRef}
              // min-h on mobile + max-h on desktop means long conversations
              // don't nest-scroll awkwardly on phones. The thread auto-scrolls
              // to the latest reply on mount + on new messages.
              className="min-h-[40vh] max-h-[70vh] space-y-3 overflow-y-auto rounded-xl bg-gray-50/70 dark:bg-gray-800/40 p-3 md:min-h-0 md:max-h-[480px]"
            >
              {replies.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No replies yet — write the first message below.
                </p>
              ) : (
                replies.map((r) => {
                  const isStaff = r.authorType === "staff";
                  const Icon = isStaff ? Shield : UserIcon;
                  return (
                    <div
                      key={r.id}
                      className={cn(
                        "flex items-start gap-2.5 rounded-xl border p-3 text-sm",
                        isStaff
                          ? "border-primary-200 bg-primary-50/60 dark:border-primary-900/40 dark:bg-primary-900/20"
                          : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900",
                      )}
                    >
                      <div
                        aria-hidden
                        className={cn(
                          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                          isStaff
                            ? "bg-primary-600 text-white"
                            : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          <span className="sr-only">
                            {isStaff ? "Staff reply from " : "Your reply from "}
                          </span>
                          <span className="text-gray-900 dark:text-gray-100">{r.authorName}</span>
                          {" · "}
                          <span>{formatDate(r.createdAt)}</span>
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                          {r.content}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <div className="flex-1">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write a reply…"
                  rows={3}
                  maxLength={MESSAGE_MAX}
                  aria-label="Reply to ticket"
                  disabled={t.status === "Closed"}
                />
                <HelpText
                  className={cn(
                    "mt-1",
                    text.length > MESSAGE_MAX - 200 && "text-amber-600",
                  )}
                >
                  {t.status === "Closed" ? (
                    "Ticket is closed — reopen it to continue the conversation."
                  ) : (
                    <>
                      <MessageSquare className="mr-1 inline h-3 w-3" />
                      {text.length.toLocaleString()} / {MESSAGE_MAX.toLocaleString()} characters
                    </>
                  )}
                </HelpText>
              </div>
              <Button
                type="button"
                className="w-full touch-manipulation sm:w-auto sm:min-w-[7rem] sm:self-start"
                disabled={!text.trim() || reply.isPending || t.status === "Closed"}
                onClick={() => void send()}
              >
                {reply.isPending ? "Sending…" : "Send reply"}
              </Button>
            </div>
          </DashboardPanel>
        </>
      )}

      <ConfirmDialog
        open={closeOpen}
        onCancel={() => setCloseOpen(false)}
        onConfirm={() => void confirmClose()}
        title="Close this ticket?"
        description="Marking the ticket closed stops notifications and locks new replies. You can open a new ticket if you need to continue the conversation."
        confirmLabel="Yes, close ticket"
        cancelLabel="Keep open"
        variant="danger"
        loading={closeTicket.isPending}
      />
    </div>
  );
}
