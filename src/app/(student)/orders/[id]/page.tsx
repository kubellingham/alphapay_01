import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/auto-refresh";
import { CopyButton } from "@/components/copy-button";
import { LocalTime } from "@/components/local-time";
import { PendingButton } from "@/components/pending-button";
import { ReceiptUpload } from "@/components/receipt-upload";
import { StatusBadge } from "@/components/status-badge";
import { StatusTimeline } from "@/components/status-timeline";
import { cancelOrder } from "@/lib/actions/orders";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  formatMoney,
  type CollectionAccount,
  type Order,
  type OrderEvent,
} from "@/lib/types";

export const metadata = { title: "Order details" };
export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  await requireUser();
  const supabase = await createClient();

  const { data } = await supabase.from("orders").select("*").eq("id", id).single();
  if (!data) notFound();
  const order = data as Order;

  const [{ data: eventsData }, { data: accountsData }] = await Promise.all([
    supabase
      .from("order_events")
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: true }),
    order.status === "awaiting_payment"
      ? supabase
          .from("collection_accounts")
          .select("*")
          .eq("currency", order.send_currency)
          .eq("is_active", true)
      : Promise.resolve({ data: null }),
  ]);
  const events = (eventsData ?? []) as OrderEvent[];
  const accounts = (accountsData ?? []) as CollectionAccount[];

  let receiptUrl: string | null = null;
  if (order.receipt_path) {
    const { data: signed } = await supabase.storage
      .from("receipts")
      .createSignedUrl(order.receipt_path, 60 * 10);
    receiptUrl = signed?.signedUrl ?? null;
  }

  const isSettled = ["delivered", "cancelled"].includes(order.status);
  const rejectionNote =
    order.status === "rejected" ? (order.staff_note ?? null) : null;

  return (
    <div className="space-y-5">
      {/* Statuses move without the user having to pull-to-refresh */}
      {!isSettled && <AutoRefresh />}

      {/* Only while the order is actually waiting for payment — never after */}
      {created && order.status === "awaiting_payment" && (
        <div className="flex items-center gap-2.5 rounded-xl border border-edge border-l-[3px] border-l-success bg-surface-2 px-3.5 py-3 text-[13px]">
          <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-success text-xs font-extrabold text-success-fg">
            ✓
          </span>
          Order placed — now send the money and upload your receipt below.
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight">
            Order <span className="font-mono">{order.reference}</span>
          </h1>
          <p className="text-xs text-muted">
            Placed <LocalTime iso={order.created_at} />
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Amounts — receive first */}
      <div className="rounded-2xl border border-edge bg-surface p-4">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted">Receive</span>
          <span className="text-base font-extrabold text-primary">
            {formatMoney(Number(order.receive_amount), order.receive_currency)}
          </span>
        </div>
        <div className="my-3 h-px bg-edge" />
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted">Send</span>
          <span className="text-base font-extrabold">
            {formatMoney(Number(order.send_amount), order.send_currency)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-faint">Locked rate</span>
          <span className="font-mono font-semibold text-accent">
            {Number(order.rate_used).toLocaleString("en-US", {
              maximumSignificantDigits: 6,
            })}
          </span>
        </div>
      </div>

      {rejectionNote !== undefined && order.status === "rejected" && (
        <div className="rounded-[14px] border border-danger bg-danger-soft p-3.5">
          <p className="flex items-center gap-2 text-sm font-bold text-danger">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
              <path d="M12 8v5m0 3h.01" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
            </svg>
            Why it was rejected
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed">
            {rejectionNote ??
              "Our team found a problem with the payment. Upload a corrected receipt below and we'll take another look."}
          </p>
        </div>
      )}

      {order.status === "awaiting_payment" && (
        <>
          {/* Pay-to card */}
          <section className="rounded-2xl border border-primary bg-primary-soft p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Pay to this account
            </p>
            {accounts.length === 0 ? (
              <p className="mt-2 text-sm text-muted">
                Payment details are being set up — contact AlphaPay support for
                where to send your {order.send_currency}.
              </p>
            ) : (
              <div className="mt-3 space-y-2.5">
                {accounts.map((account) => (
                  <div key={account.id} className="space-y-2 border-b border-edge pb-2.5 last:border-0 last:pb-0">
                    {Object.entries(account.account_details).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] capitalize text-muted">
                            {account.type === "mobile_money" ? "📱" : "🏦"}{" "}
                            {account.account_name} · {k.replaceAll("_", " ")}
                          </p>
                          <p className="truncate font-mono text-[15px] font-bold">{v}</p>
                        </div>
                        <CopyButton value={v} />
                      </div>
                    ))}
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 pt-0.5">
                  <div>
                    <p className="text-[11px] text-muted">Reference (important)</p>
                    <p className="font-mono text-[15px] font-bold">{order.reference}</p>
                  </div>
                  <CopyButton value={order.reference} />
                </div>
              </div>
            )}
          </section>

          <section>
            <p className="mb-2 text-[12.5px] font-bold">Upload payment receipt</p>
            <ReceiptUpload orderId={order.id} />
          </section>
        </>
      )}

      {order.status === "rejected" && (
        <section>
          <p className="mb-2 text-[12.5px] font-bold">Upload a corrected receipt</p>
          <ReceiptUpload orderId={order.id} label="Resubmit for review" />
        </section>
      )}

      {/* Delivery */}
      <section className="rounded-2xl border border-edge bg-surface p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Delivery</p>
        <p className="mt-2 text-sm font-bold">
          {order.delivery_method === "cash" ? "Cash to address" : "Bank transfer"}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          {(() => {
            const d = order.delivery_details as unknown as Record<string, string>;
            const ordered =
              order.delivery_method === "cash"
                ? [d.recipient_name, d.address, d.city, d.landmark]
                : [d.account_name, d.bank_name, d.account_number, d.branch_or_ifsc];
            return ordered.filter(Boolean).join(" · ");
          })()}
        </p>
      </section>

      {receiptUrl && (
        <section className="rounded-2xl border border-edge bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">
              Your receipt
            </p>
            <a
              href={receiptUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-bold text-primary underline"
            >
              View ↗
            </a>
          </div>
          {order.status === "under_review" && (
            <details className="mt-2">
              <summary className="cursor-pointer text-[13px] text-muted">
                Uploaded the wrong file? Replace it
              </summary>
              <div className="mt-3">
                <ReceiptUpload orderId={order.id} label="Replace receipt" />
              </div>
            </details>
          )}
        </section>
      )}

      {order.status === "delivered" && (
        <Link
          href={`/orders/${order.id}/receipt`}
          className="flex h-[52px] items-center justify-center gap-2 rounded-[14px] bg-primary text-base font-bold text-primary-fg hover:bg-primary-hover"
        >
          🧾 View &amp; download your receipt
        </Link>
      )}

      {/* Progress */}
      <section>
        <p className="mb-3 text-[12.5px] font-bold">Progress</p>
        <StatusTimeline events={events} currentStatus={order.status} />
      </section>

      {order.status === "awaiting_payment" && (
        <form action={cancelOrder}>
          <input type="hidden" name="order_id" value={order.id} />
          <PendingButton
            pendingText="Cancelling…"
            className="h-[46px] w-full rounded-xl border border-danger bg-danger-soft text-sm font-bold text-danger"
          >
            Cancel order
          </PendingButton>
        </form>
      )}

      <Link href="/orders" className="block text-center text-sm text-muted underline">
        ← Back to my orders
      </Link>
    </div>
  );
}
