import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  usePortalOrder,
  useOrderMessages,
  usePostOrderMessage,
} from "@/api/portal-dashboard";
import { paths } from "@/routes/paths";
import { formatUsd, formatDate } from "@/lib/format";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const order = usePortalOrder(orderId);
  const messages = useOrderMessages(orderId);
  const postMsg = usePostOrderMessage(orderId ?? "");
  const [text, setText] = useState("");

  const o = order.data;

  const handleSend = async () => {
    if (!text.trim() || !orderId) return;
    await postMsg.mutateAsync(text.trim());
    setText("");
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
