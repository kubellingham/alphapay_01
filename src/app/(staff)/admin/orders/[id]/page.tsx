import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/auto-refresh";
import { DeleteOrderButton } from "@/components/delete-order-button";
import { LocalTime } from "@/components/local-time";
import { OrderReviewActions } from "@/components/order-review-actions";
import { StatusBadge } from "@/components/status-badge";
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

  const [{ data: customerData }, { data: eventsData }, { data: rateRow }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", order.user_id).single(),
      supabase
        .from("order_events")
        .select("*")
        .eq("order_id", id)
        .order("created_at", { ascending: true }),
      order.margin_used == null
        ? supabase.from("rates").select("margin_percent").eq("pair", order.direction).single()
        : Promise.resolve({ data: null }),
    ]);
  const customer = customerData as Profile | null;
  const events = (eventsData ?? []) as OrderEvent[];

  const margin =
    order.margin_used != null
      ? Number(order.margin_used)
      : Number(rateRow?.margin_percent ?? 0);
  const estMargin =
    margin > 0 && margin < 100
      ? Number(order.receive_amount) * (margin / (100 - margin))
      : 0;

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
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <AutoRefresh intervalMs={15000} />

      <div className="lg:col-span-2">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 text-[13px] text-muted hover:text-foreground"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Queue
          </Link>
          <h2 className="font-mono text-xl font-extrabold">{order.reference}</h2>
          <StatusBadge status={order.status} />
          <span className="text-[13px] text-muted">
            <LocalTime iso={order.created_at} />
          </span>
        </div>
      </div>

      {/* Left column: receipt + actions */}
      <div className="space-y-4">
        <section>
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">
            Payment receipt
          </p>
          {receiptUrl ? (
            receiptIsPdf ? (
              <a
                href={receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-[120px] items-center justify-center rounded-[14px] border border-edge bg-surface-2 font-bold text-primary underline"
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
                  className="max-h-[420px] rounded-[14px] border border-edge"
                />
              </a>
            )
          ) : (
            <div className="flex h-[120px] items-center justify-center rounded-[14px] border border-edge bg-surface-2 text-sm text-faint">
              No receipt uploaded yet.
            </div>
          )}
        </section>

        <section className="space-y-3">
          <OrderReviewActions orderId={order.id} status={order.status} />
          {order.status === "delivered" && (
            <div className="flex flex-wrap gap-2.5">
              <Link
                href={`/orders/${order.id}/receipt`}
                className="flex h-11 flex-1 items-center justify-center rounded-xl border border-edge-strong bg-surface-2 text-sm font-bold hover:border-primary"
              >
                🧾 Official receipt
              </Link>
              {phoneDigits && (
                <a
                  href={`https://wa.me/${phoneDigits}?text=${waMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-edge-strong bg-surface-2 text-sm font-bold text-[#25c93f]"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M12 2a10 10 0 0 0-8.6 15l-1.4 5 5.1-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.2 14.8l-.4-.2-3 .8.8-2.9-.2-.4A8 8 0 0 1 12 4z" />
                  </svg>
                  WhatsApp
                </a>
              )}
            </div>
          )}
          {order.staff_note && (
            <p className="rounded-xl bg-surface-2 px-3.5 py-2.5 text-xs text-muted">
              Note on file: “{order.staff_note}”
            </p>
          )}
        </section>
      </div>

      {/* Right column: facts */}
      <div className="space-y-4">
        <section className="rounded-[14px] border border-edge bg-surface p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Amounts</p>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between">
              <span className="text-muted">Customer pays</span>
              <span className="text-[15px] font-bold">
                {formatMoney(Number(order.send_amount), order.send_currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">We deliver</span>
              <span className="text-[15px] font-bold text-primary">
                {formatMoney(Number(order.receive_amount), order.receive_currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Locked rate</span>
              <span className="font-mono font-semibold text-accent">
                {Number(order.rate_used).toLocaleString("en-US", {
                  maximumSignificantDigits: 6,
                })}
              </span>
            </div>
            {estMargin > 0 && (
              <div className="flex justify-between border-t border-edge pt-2">
                <span className="text-muted">Est. margin</span>
                <span className="text-[15px] font-bold text-success">
                  +{formatMoney(estMargin, order.receive_currency)}
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[14px] border border-edge bg-surface p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
            Delivery details
          </p>
          <p className="text-sm font-bold">
            {order.delivery_method === "cash" ? "Cash" : "Bank transfer"}
          </p>
          <dl className="mt-2 space-y-1 text-[13px]">
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

        <section className="rounded-[14px] border border-edge bg-surface p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
            Customer contact
          </p>
          <p className="text-sm font-bold">{customer?.full_name ?? "—"}</p>
          <dl className="mt-2 space-y-1.5 text-[13px]">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Email</dt>
              <dd className="truncate font-semibold">{customer?.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Phone</dt>
              <dd className="font-mono">
                {customer?.phone ? (
                  <a href={`tel:${customer.phone}`} className="text-primary underline">
                    {customer.phone}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-[14px] border border-edge bg-surface p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">History</p>
          <StatusTimeline events={events} currentStatus={order.status} />
        </section>

        <DeleteOrderButton orderId={order.id} reference={order.reference} />
      </div>
    </div>
  );
}
