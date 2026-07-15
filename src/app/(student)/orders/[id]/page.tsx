import Link from "next/link";
import { notFound } from "next/navigation";
import { ReceiptUpload } from "@/components/receipt-upload";
import { StatusBadge } from "@/components/status-badge";
import { StatusTimeline } from "@/components/status-timeline";
import { cancelOrder } from "@/lib/actions/orders";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  STATUS_INFO,
  formatMoney,
  type BankDeliveryDetails,
  type CashDeliveryDetails,
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

  const statusInfo = STATUS_INFO[order.status];

  return (
    <div className="space-y-6">
      {created && (
        <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4 text-sm">
          🎉 <span className="font-semibold">Order placed!</span> Now send the
          money using the details below and upload your receipt.
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-muted">{order.reference}</p>
          <h1 className="text-2xl font-bold">
            {formatMoney(Number(order.receive_amount), order.receive_currency)}
          </h1>
          <p className="text-sm text-muted">
            Sender pays {formatMoney(Number(order.send_amount), order.send_currency)} ·
            rate locked at{" "}
            {Number(order.rate_used).toLocaleString("en-US", {
              maximumSignificantDigits: 6,
            })}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <p className="rounded-xl border border-edge bg-surface p-4 text-sm text-muted">
        {statusInfo.description}
      </p>

      {order.status === "awaiting_payment" && (
        <section className="rounded-2xl border border-warning/40 bg-surface p-5">
          <h2 className="font-bold">1 · Send the money</h2>
          {accounts.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              Payment details are being set up — contact AlphaPay support for
              where to send your {order.send_currency}.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {accounts.map((account) => (
                <li
                  key={account.id}
                  className="rounded-xl border border-edge bg-background p-4 text-sm"
                >
                  <p className="font-semibold">
                    {account.type === "mobile_money" ? "📱" : "🏦"} {account.account_name}
                  </p>
                  <dl className="mt-2 space-y-1">
                    {Object.entries(account.account_details).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4">
                        <dt className="capitalize text-muted">{k.replaceAll("_", " ")}</dt>
                        <dd className="font-mono font-semibold">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted">
            Include your order reference{" "}
            <span className="font-mono font-semibold text-foreground">
              {order.reference}
            </span>{" "}
            in the payment note if possible.
          </p>

          <h2 className="mt-6 font-bold">2 · Upload the payment receipt</h2>
          <div className="mt-3">
            <ReceiptUpload orderId={order.id} />
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-edge bg-surface p-5">
        <h2 className="font-bold">Delivery</h2>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Method</dt>
            <dd className="font-semibold">
              {order.delivery_method === "cash" ? "Cash to address" : "Bank transfer"}
            </dd>
          </div>
          {order.delivery_method === "cash" ? (
            <>
              <Row label="Recipient" value={(order.delivery_details as CashDeliveryDetails).recipient_name} />
              <Row label="Address" value={(order.delivery_details as CashDeliveryDetails).address} />
              <Row label="City" value={(order.delivery_details as CashDeliveryDetails).city} />
              <Row label="Landmark" value={(order.delivery_details as CashDeliveryDetails).landmark} />
            </>
          ) : (
            <>
              <Row label="Account name" value={(order.delivery_details as BankDeliveryDetails).account_name} />
              <Row label="Account number" value={(order.delivery_details as BankDeliveryDetails).account_number} />
              <Row label="Bank" value={(order.delivery_details as BankDeliveryDetails).bank_name} />
              <Row label="Branch / IFSC" value={(order.delivery_details as BankDeliveryDetails).branch_or_ifsc} />
            </>
          )}
        </dl>
      </section>

      {receiptUrl && (
        <section className="rounded-2xl border border-edge bg-surface p-5">
          <h2 className="font-bold">Your receipt</h2>
          <a
            href={receiptUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm font-semibold text-accent underline"
          >
            View uploaded receipt ↗
          </a>
        </section>
      )}

      <section className="rounded-2xl border border-edge bg-surface p-5">
        <h2 className="font-bold">Progress</h2>
        <div className="mt-4">
          <StatusTimeline events={events} />
        </div>
      </section>

      {order.status === "awaiting_payment" && (
        <form action={cancelOrder}>
          <input type="hidden" name="order_id" value={order.id} />
          <button className="w-full rounded-xl border border-danger/40 py-3 text-sm font-semibold text-danger hover:bg-danger/10">
            Cancel this order
          </button>
        </form>
      )}

      <Link href="/orders" className="block text-center text-sm text-muted underline">
        ← Back to my orders
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
