import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/auto-refresh";
import { DeleteOrderButton } from "@/components/delete-order-button";
import { OrderReviewActions } from "@/components/order-review-actions";
import { StatusBadge } from "@/components/status-badge";
import { LocalTime } from "@/components/local-time";
import { StatusTimeline } from "@/components/status-timeline";
import { createClient } from "@/lib/supabase/server";
import {
  formatMoney,
  type Order,
  type OrderEvent,
  type Profile,
} from "@/lib/types";

export const metadata = { title: "Review order" };
export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase.from("orders").select("*").eq("id", id).single();
  if (!data) notFound();
  const order = data as Order;

  const [{ data: customerData }, { data: eventsData }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", order.user_id).single(),
    supabase
      .from("order_events")
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: true }),
  ]);
  const customer = customerData as Profile | null;
  const events = (eventsData ?? []) as OrderEvent[];

  let receiptUrl: string | null = null;
  let receiptIsPdf = false;
  if (order.receipt_path) {
    const { data: signed } = await supabase.storage
      .from("receipts")
      .createSignedUrl(order.receipt_path, 60 * 10);
    receiptUrl = signed?.signedUrl ?? null;
    receiptIsPdf = order.receipt_path.endsWith(".pdf");
  }

  const phoneDigits = customer?.phone?.replace(/[^0-9]/g, "") ?? "";
  const waMessage = encodeURIComponent(
    `Hello ${customer?.full_name ?? ""}! 👋 AlphaPay here.\n\n` +
      `Your transfer ${order.reference} has been delivered:\n` +
      `• You received: ${formatMoney(Number(order.receive_amount), order.receive_currency)}\n` +
      `• Sender paid: ${formatMoney(Number(order.send_amount), order.send_currency)}\n\n` +
      `Your official receipt is in the app under My orders → ${order.reference}.\n` +
      `Thank you for using AlphaPay! 🇹🇿🇮🇳`,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <AutoRefresh intervalMs={15000} />
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-xs text-muted">{order.reference}</p>
            <h2 className="text-2xl font-bold">
              {formatMoney(Number(order.receive_amount), order.receive_currency)}
            </h2>
            <p className="text-sm text-muted">
              Sender pays {formatMoney(Number(order.send_amount), order.send_currency)} ·
              locked rate{" "}
              {Number(order.rate_used).toLocaleString("en-US", {
                maximumSignificantDigits: 6,
              })}{" "}
              · <LocalTime iso={order.created_at} />
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <section className="rounded-2xl border border-edge bg-surface p-5">
          <h3 className="font-bold">Payment receipt</h3>
          {receiptUrl ? (
            <div className="mt-3">
              {receiptIsPdf ? (
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-accent underline"
                >
                  Open PDF receipt ↗
                </a>
              ) : (
                <a href={receiptUrl} target="_blank" rel="noreferrer">
                  {/* Signed URL — next/image can't optimize it */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={receiptUrl}
                    alt={`Receipt for ${order.reference}`}
                    className="max-h-[480px] rounded-xl border border-edge"
                  />
                </a>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">No receipt uploaded yet.</p>
          )}
        </section>

        <section className="rounded-2xl border border-edge bg-surface p-5">
          <h3 className="font-bold">Deliver to</h3>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Method</dt>
              <dd className="font-semibold">
                {order.delivery_method === "cash" ? "Cash to address" : "Bank transfer"}
              </dd>
            </div>
            {Object.entries(order.delivery_details as unknown as Record<string, string>).map(
              ([k, v]) =>
                v ? (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="capitalize text-muted">{k.replaceAll("_", " ")}</dt>
                    <dd className="text-right font-semibold">{v}</dd>
                  </div>
                ) : null,
            )}
          </dl>
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-warning/40 bg-surface p-5">
          <h3 className="font-bold">Actions</h3>
          <div className="mt-3">
            <OrderReviewActions orderId={order.id} status={order.status} />
          </div>
          {order.staff_note && (
            <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">
              Note on file: “{order.staff_note}”
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-edge bg-surface p-5 text-sm">
          <h3 className="font-bold">Customer</h3>
          <dl className="mt-3 space-y-1">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Name</dt>
              <dd className="font-semibold">{customer?.full_name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Email</dt>
              <dd className="font-semibold">{customer?.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Phone</dt>
              <dd className="font-semibold">
                {customer?.phone ? (
                  <a href={`tel:${customer.phone}`} className="text-accent underline">
                    {customer.phone}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </section>

        {order.status === "delivered" && (
          <section className="rounded-2xl border border-accent/40 bg-surface p-5">
            <h3 className="font-bold">Receipt</h3>
            <div className="mt-3 space-y-2">
              <Link
                href={`/orders/${order.id}/receipt`}
                className="block rounded-xl border border-edge py-2.5 text-center text-sm font-semibold hover:border-accent"
              >
                🧾 View official receipt
              </Link>
              {phoneDigits && (
                <a
                  href={`https://wa.me/${phoneDigits}?text=${waMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl bg-[#25D366] py-2.5 text-center text-sm font-bold text-background"
                >
                  Send receipt via WhatsApp
                </a>
              )}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-edge bg-surface p-5">
          <h3 className="font-bold">History</h3>
          <div className="mt-4">
            <StatusTimeline events={events} />
          </div>
        </section>

        <DeleteOrderButton orderId={order.id} reference={order.reference} />

        <Link
          href="/admin/orders"
          className="block text-center text-sm text-muted underline"
        >
          ← Back to queue
        </Link>
      </div>
    </div>
  );
}
