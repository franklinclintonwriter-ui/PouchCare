import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Star, XCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
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

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const queryClient = useQueryClient();
  const order = usePortalOrder(orderId);
  const messages = useOrderMessages(orderId);
  const postMsg = usePostOrderMessage(orderId ?? "");
  const cancelOrder = useCancelOrder();
  const requestRevision = useRequestRevision();
  const reviewOrder = useReviewOrder();

  const [text, setText] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [isRevisionFormOpen, setIsRevisionFormOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);

  const o = order.data;

  const handleSend = async () => {
    if (!text.trim() || !orderId) return;
    await postMsg.mutateAsync(text.trim());
    setText("");
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      await cancelOrder.mutateAsync(orderId ?? "");
      toast.success("Order cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["portal-order", orderId] });
    } catch (error) {
      toast.error("Failed to cancel order");
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionNote.trim()) {
      toast.error("Please enter a revision note");
      return;
    }
    try {
      await requestRevision.mutateAsync({ orderId: orderId ?? "", note: revisionNote.trim() });
      toast.success("Revision request submitted");
      setRevisionNote("");
      setIsRevisionFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ["portal-order", orderId] });
    } catch (error) {
      toast.error("Failed to request revision");
    }
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      toast.error("Please select a rating");
      return;
    }
    try {
      await reviewOrder.mutateAsync({
        orderId: orderId ?? "",
        rating: reviewRating,
        reviewNote: reviewText.trim(),
      });
      toast.success("Review submitted successfully");
      setReviewRating(0);
      setReviewText("");
      setIsReviewFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ["portal-order", orderId] });
    } catch (error) {
      toast.error("Failed to submit review");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to={paths.dashboardOrders}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-1 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
      </div>

      {order.isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : order.isError || !o ? (
        <p className="text-sm text-red-600">Order not found.</p>
      ) : (
        <>
          <DashboardPanel
            title={`Order #${o.orderId}`}
            description={o.serviceName ?? o.service}
            action={
              <Badge variant="sky">{o.status.replace(/_/g, " ")}</Badge>
            }
          >
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Amount
                </dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {formatUsd(o.amountUsd)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Placed
                </dt>
                <dd className="text-gray-800">{formatDate(o.orderDate)}</dd>
              </div>
              {o.deliveryDate && (
                <div>
                  <dt className="text-xs font-medium uppercase text-gray-500">
                    Delivered
                  </dt>
                  <dd className="text-gray-800">
                    {formatDate(o.deliveryDate)}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Payment
                </dt>
                <dd className="text-gray-800">{o.paymentStatus ?? "—"}</dd>
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
                onClick={() => void handleCancelOrder()}
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
              <DashboardPanel title="Request Revision" className="border-orange-200 bg-orange-50">
                <div className="space-y-3">
                  <textarea
                    value={revisionNote}
                    onChange={(e) => setRevisionNote(e.target.value)}
                    placeholder="Describe what changes you'd like to see…"
                    rows={4}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => void handleRequestRevision()}
                      disabled={requestRevision.isPending || !revisionNote.trim()}
                    >
                      {requestRevision.isPending ? "Submitting…" : "Submit Revision Request"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsRevisionFormOpen(false);
                        setRevisionNote("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DashboardPanel>
            )}

          {/* Rate & Review Section */}
          {(o.status === "DELIVERED" || o.status === "COMPLETED") && (
            <DashboardPanel title="Rate & Review">
              {(o as any).rating ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= (o as any).rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {(o as any).rating}/5
                    </span>
                  </div>
                  {(o as any).reviewNote && (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {(o as any).reviewNote}
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
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Rating
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="p-1 hover:scale-110 transition-transform"
                            >
                              <Star
                                className={`h-6 w-6 ${
                                  star <= reviewRating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300 hover:text-yellow-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Review (optional)
                        </label>
                        <textarea
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="Share your thoughts about this order…"
                          rows={3}
                          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => void handleSubmitReview()}
                          disabled={reviewOrder.isPending || reviewRating === 0}
                        >
                          {reviewOrder.isPending ? "Submitting…" : "Submit Review"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsReviewFormOpen(false);
                            setReviewRating(0);
                            setReviewText("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </DashboardPanel>
          )}

          <DashboardPanel
            title="Messages"
            description="Chat with the team about this order."
          >
            <div className="mb-4 max-h-72 space-y-3 overflow-y-auto rounded-xl bg-gray-50 p-3">
              {messages.isLoading ? (
                <p className="text-sm text-gray-500">Loading messages…</p>
              ) : !messages.data?.length ? (
                <p className="text-sm text-gray-500">No messages yet.</p>
              ) : (
                messages.data.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-lg border border-gray-100 bg-white p-3 text-sm shadow-sm"
                  >
                    <p className="text-xs font-medium text-gray-500">
                      {m.authorName} · {formatDate(m.createdAt)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-gray-800">
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
                className="min-h-[5.5rem] flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25"
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
    </div>
  );
}
