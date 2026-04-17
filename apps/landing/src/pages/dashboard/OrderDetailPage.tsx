import { useParams, Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Star, XCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  usePortalOrder,
  useOrderMessages,
  usePostOrderMessage,
  useCancelOrder,
  useRequestRevision,
  useReviewOrder,
} from "@/api/portal-dashboard";
import { paths } from "@/routes/paths";
import { formatUsd, formatDate } from "@/lib/format";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField } from "@/components/ui/FormField";
import { Textarea } from "@/components/ui/Textarea";

const revisionSchema = z.object({
  note: z
    .string()
    .min(1, "Please enter a revision note")
    .max(2000, "Revision note is too long"),
});

const reviewSchema = z.object({
  rating: z.coerce.number().min(1, "Please select a rating").max(5),
  reviewNote: z.string().max(2000, "Review is too long").optional(),
});

type RevisionValues = z.infer<typeof revisionSchema>;
type ReviewValues = z.infer<typeof reviewSchema>;

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const order = usePortalOrder(orderId);
  const messages = useOrderMessages(orderId);
  const postMsg = usePostOrderMessage(orderId ?? "");
  const cancelOrder = useCancelOrder();
  const requestRevision = useRequestRevision();
  const reviewOrder = useReviewOrder();

  const [text, setText] = useState("");
  const [isRevisionFormOpen, setIsRevisionFormOpen] = useState(false);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const messageThreadRef = useRef<HTMLDivElement | null>(null);

  const revisionForm = useForm<RevisionValues>({
    resolver: zodResolver(revisionSchema),
    defaultValues: { note: "" },
    mode: "onBlur",
  });
  const reviewForm = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, reviewNote: "" },
    mode: "onBlur",
  });

  const o = order.data;
  const msgList = messages.data ?? [];
  const awaitingStaffReply =
    msgList.length > 0 &&
    String(msgList[msgList.length - 1]?.authorType ?? "").toLowerCase() ===
      "client";

  // Auto-scroll the message thread to the bottom when a new message arrives
  // (or the thread first loads). Prevents the "newest reply hidden" problem.
  useEffect(() => {
    const el = messageThreadRef.current;
    if (!el) return;
    // Use requestAnimationFrame so the DOM has already rendered the new message.
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [msgList.length]);

  const handleSend = async () => {
    if (!text.trim() || !orderId) return;
    try {
      await postMsg.mutateAsync(text.trim());
      setText("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not send message",
      );
    }
  };

  const handleCancelOrder = async () => {
    try {
      await cancelOrder.mutateAsync(orderId ?? "");
      toast.success("Order cancelled successfully");
      setIsCancelDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel order",
      );
    }
  };

  const submitRevision = revisionForm.handleSubmit(async (values) => {
    try {
      await requestRevision.mutateAsync({
        orderId: orderId ?? "",
        note: values.note.trim(),
      });
      toast.success("Revision request submitted");
      revisionForm.reset({ note: "" });
      setIsRevisionFormOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to request revision",
      );
    }
  });

  const submitReview = reviewForm.handleSubmit(async (values) => {
    try {
      await reviewOrder.mutateAsync({
        orderId: orderId ?? "",
        rating: values.rating,
        reviewNote: values.reviewNote?.trim() || undefined,
      });
      toast.success("Review submitted successfully");
      reviewForm.reset({ rating: 0, reviewNote: "" });
      setIsReviewFormOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit review",
      );
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to={paths.dashboardOrders}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
      </div>

      {order.isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
      ) : order.isError || !o ? (
        <p className="text-sm text-red-600">Order not found.</p>
      ) : (
        <>
          <DashboardPanel
            title={`Order #${o.orderId}`}
            description={o.serviceName ?? o.service}
            action={<Badge variant="sky">{o.status.replace(/_/g, " ")}</Badge>}
          >
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  Amount
                </dt>
                <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatUsd(o.amountUsd)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  Placed
                </dt>
                <dd className="text-gray-800 dark:text-gray-200">
                  {formatDate(o.orderDate)}
                </dd>
              </div>
              {o.deliveryDate && (
                <div>
                  <dt className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Delivered
                  </dt>
                  <dd className="text-gray-800 dark:text-gray-200">
                    {formatDate(o.deliveryDate)}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  Payment
                </dt>
                <dd className="text-gray-800 dark:text-gray-200">
                  {o.paymentStatus ?? "—"}
                </dd>
              </div>
            </dl>
          </DashboardPanel>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {(o.status === "PENDING" || o.status === "PROCESSING") && (
              <Button
                type="button"
                variant="danger"
                className="inline-flex items-center gap-2"
                onClick={() => setIsCancelDialogOpen(true)}
                disabled={cancelOrder.isPending}
              >
                <XCircle className="h-4 w-4" />
                {cancelOrder.isPending ? "Cancelling…" : "Cancel Order"}
              </Button>
            )}
            {(o.status === "DELIVERED" || o.status === "COMPLETED") && (
              <Button
                type="button"
                variant="outline"
                className="inline-flex items-center gap-2"
                onClick={() => setIsRevisionFormOpen(!isRevisionFormOpen)}
              >
                <RotateCcw className="h-4 w-4" />
                Request Revision
              </Button>
            )}
          </div>

          {/* Revision Request Form */}
          {isRevisionFormOpen &&
            (o.status === "DELIVERED" || o.status === "COMPLETED") && (
              <DashboardPanel
                title="Request Revision"
                className="border-orange-200 bg-orange-50"
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submitRevision();
                  }}
                  className="space-y-3"
                  noValidate
                >
                  <FormField
                    label="Revision note"
                    required
                    error={revisionForm.formState.errors.note?.message}
                  >
                    {({
                      id,
                      "aria-describedby": desc,
                      "aria-invalid": inv,
                      "aria-required": req,
                    }) => (
                      <Textarea
                        id={id}
                        rows={4}
                        placeholder="Describe what changes you'd like to see…"
                        aria-describedby={desc}
                        aria-invalid={inv}
                        aria-required={req}
                        disabled={requestRevision.isPending}
                        {...revisionForm.register("note")}
                      />
                    )}
                  </FormField>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={requestRevision.isPending}>
                      {requestRevision.isPending
                        ? "Submitting…"
                        : "Submit Revision Request"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsRevisionFormOpen(false);
                        revisionForm.reset({ note: "" });
                      }}
                      disabled={requestRevision.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DashboardPanel>
            )}

          {/* Rate & Review Section */}
          {(o.status === "DELIVERED" || o.status === "COMPLETED") && (
            <DashboardPanel title="Rate & Review">
              {o.rating ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= (o.rating ?? 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {o.rating}/5
                    </span>
                  </div>
                  {o.reviewNote && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {o.reviewNote}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {!isReviewFormOpen ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="inline-flex items-center gap-2"
                      onClick={() => setIsReviewFormOpen(true)}
                    >
                      <Star className="h-4 w-4" />
                      Leave a Review
                    </Button>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void submitReview();
                      }}
                      className="space-y-4"
                      noValidate
                    >
                      <FormField
                        label="Rating"
                        required
                        error={reviewForm.formState.errors.rating?.message}
                      >
                        {({
                          id,
                          "aria-describedby": desc,
                          "aria-invalid": inv,
                          "aria-required": req,
                        }) => (
                          <>
                            <input
                              id={id}
                              type="hidden"
                              aria-describedby={desc}
                              aria-invalid={inv}
                              aria-required={req}
                              {...reviewForm.register("rating", {
                                valueAsNumber: true,
                              })}
                            />
                            <div className="flex gap-2" aria-label="Rating">
                              {[1, 2, 3, 4, 5].map((star) => {
                                const current =
                                  reviewForm.getValues("rating") ?? 0;
                                const selected = star <= current;
                                return (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() =>
                                      reviewForm.setValue("rating", star, {
                                        shouldValidate: true,
                                      })
                                    }
                                    disabled={reviewOrder.isPending}
                                    className="p-1 transition-transform hover:scale-110 disabled:opacity-60 disabled:cursor-not-allowed"
                                    aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
                                  >
                                    <Star
                                      className={
                                        selected
                                          ? "h-6 w-6 fill-yellow-400 text-yellow-400"
                                          : "h-6 w-6 text-gray-300 hover:text-yellow-300"
                                      }
                                    />
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </FormField>

                      <FormField
                        label="Review (optional)"
                        error={reviewForm.formState.errors.reviewNote?.message}
                      >
                        {({
                          id,
                          "aria-describedby": desc,
                          "aria-invalid": inv,
                        }) => (
                          <Textarea
                            id={id}
                            rows={3}
                            placeholder="Share your thoughts about this order…"
                            aria-describedby={desc}
                            aria-invalid={inv}
                            disabled={reviewOrder.isPending}
                            {...reviewForm.register("reviewNote")}
                          />
                        )}
                      </FormField>

                      <div className="flex gap-2">
                        <Button type="submit" disabled={reviewOrder.isPending}>
                          {reviewOrder.isPending
                            ? "Submitting…"
                            : "Submit Review"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsReviewFormOpen(false);
                            reviewForm.reset({ rating: 0, reviewNote: "" });
                          }}
                          disabled={reviewOrder.isPending}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </DashboardPanel>
          )}

          <DashboardPanel
            title="Messages"
            description="Chat with the team about this order."
          >
            {awaitingStaffReply && (
              <div className="mb-3 inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                Awaiting staff reply
              </div>
            )}
            <div
              ref={messageThreadRef}
              className="mb-4 max-h-72 space-y-3 overflow-y-auto rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3"
            >
              {messages.isLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Loading messages…
                </p>
              ) : !messages.data?.length ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No messages yet.
                </p>
              ) : (
                messages.data.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 text-sm shadow-sm"
                  >
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {m.authorName} · {formatDate(m.createdAt)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                      {m.content}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a message…"
                rows={3}
                className="min-h-[5.5rem] flex-1 rounded-xl border border-gray-300 dark:border-gray-600 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25 dark:bg-gray-800"
              />
              <Button
                type="button"
                className="w-full touch-manipulation sm:w-auto sm:min-w-[7rem] sm:self-stretch"
                disabled={!text.trim() || postMsg.isPending}
                onClick={() => void handleSend()}
              >
                {postMsg.isPending ? "Sending…" : "Send"}
              </Button>
            </div>
          </DashboardPanel>
        </>
      )}

      <ConfirmDialog
        open={isCancelDialogOpen}
        onCancel={() => setIsCancelDialogOpen(false)}
        onConfirm={() => void handleCancelOrder()}
        title="Cancel this order?"
        description="The order will be marked cancelled and any associated commission held will be released. This action cannot be undone."
        confirmLabel="Yes, cancel order"
        cancelLabel="Keep order"
        variant="danger"
        loading={cancelOrder.isPending}
      />
    </div>
  );
}
