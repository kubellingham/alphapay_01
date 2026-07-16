import Link from "next/link";
import { notFound } from "next/navigation";
import { LogoMark } from "@/components/logo";
import { PrintButton } from "@/components/print-button";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatMoney, type Order, type Profile } from "@/lib/types";

export const metadata = { title: "Receipt" };
export const dynamic = "force-dynamic";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();
  const supabase = await createClient();

  const { data } = await supabase.from("orders").select("*").eq("id", id).single();
  if (!data) notFound();
  const order = data as Order;
  if (order.status !== "delivered") notFound();

  const [{ data: customerData }, { data: deliveredEvent }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", order.user_id).single(),
    supabase
      .from("order_events")
      .select("created_at")
      .eq("order_id", id)
      .eq("to_status", "delivered")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const customer = customerData as Profile | null;
  const deliveredAt = deliveredEvent?.created_at ?? order.updated_at;
  const details = order.delivery_details as unknown as Record<string, string>;
  const recipient =
    details.recipient_name ?? details.account_name ?? customer?.full_name ?? "—";
  const deliveryLine =
    order.delivery_method === "cash"
      ? `Cash · ${[details.city, details.address].filter(Boolean)[0] ?? ""}`
      : `Bank transfer · ${details.bank_name ?? ""}`;

  return (
    <div>
      <div
        id="receipt"
        className="overflow-hidden rounded-[18px] border border-edge bg-surface shadow-float print:rounded-none print:border-0 print:shadow-none"
      >
        {/* Flag-gradient bar: jade for Tanzania-India green, marigold for the gold */}
        <div
          className="h-2"
          style={{
            background: "linear-gradient(90deg, var(--primary) 0 50%, var(--accent) 50% 100%)",
          }}
        />
        <div className="p-6 pb-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <LogoMark size={36} />
              <div>
                <p className="text-[17px] font-extrabold leading-tight tracking-tight">
                  AlphaPay
                </p>
                <p className="text-[11px] text-muted">Money transfer receipt</p>
              </div>
            </div>
            <StatusBadge status="delivered" />
          </div>

          <div className="mt-5 flex justify-between border-b border-dashed border-edge-strong pb-4">
            <div>
              <p className="text-[11px] text-muted">Receipt no.</p>
              <p className="font-mono text-[15px] font-semibold">{order.reference}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted">Date delivered</p>
              <p className="text-sm font-semibold">{formatDateTime(deliveredAt)} IST</p>
            </div>
          </div>

          <div className="border-b border-dashed border-edge-strong py-5 text-center">
            <p className="text-xs text-muted">Amount delivered</p>
            <p className="mt-1 text-[32px] font-extrabold text-primary">
              {formatMoney(Number(order.receive_amount), order.receive_currency)}
            </p>
            <p className="mt-0.5 text-[13px] text-muted">
              from {formatMoney(Number(order.send_amount), order.send_currency)} · rate{" "}
              <span className="font-mono">
                {Number(order.rate_used).toLocaleString("en-US", {
                  maximumSignificantDigits: 6,
                })}
              </span>
            </p>
          </div>

          <dl className="flex flex-col gap-2.5 py-4 text-[13.5px]">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Customer</dt>
              <dd className="font-semibold">{customer?.full_name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Recipient</dt>
              <dd className="font-semibold">{recipient}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Delivery</dt>
              <dd className="font-semibold">{deliveryLine}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Order placed</dt>
              <dd className="font-semibold">{formatDateTime(order.created_at)} IST</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Reference</dt>
              <dd className="font-mono font-semibold">{order.reference}</dd>
            </div>
          </dl>

          <div className="flex items-center gap-2 border-t border-edge pt-4 text-[11.5px] text-faint">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Verified &amp; delivered by AlphaPay
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3 print:hidden">
        <PrintButton />
        <p className="text-center text-xs text-muted">
          “Download PDF / Print” opens your device&apos;s print screen — choose
          “Save as PDF” to keep or share the receipt.
        </p>
        <Link
          href={`/orders/${order.id}`}
          className="block text-center text-sm text-muted underline"
        >
          ← Back to order
        </Link>
      </div>
    </div>
  );
}
