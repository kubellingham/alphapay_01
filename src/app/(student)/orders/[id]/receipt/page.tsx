import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  formatDateTime,
  formatMoney,
  type Order,
  type Profile,
} from "@/lib/types";

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

  return (
    <div className="print:text-black">
      {/* The receipt card — styled to look right on screen AND on paper */}
      <div
        id="receipt"
        className="rounded-2xl border border-edge bg-white p-8 text-slate-900 shadow-xl print:rounded-none print:border-0 print:p-0 print:shadow-none"
      >
        <div className="flex items-start justify-between border-b-2 border-emerald-500 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500 font-black text-white">
                A
              </span>
              <span className="text-xl font-black tracking-tight">AlphaPay</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Tanzania 🇹🇿 ⇄ 🇮🇳 India money transfer
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              Official receipt
            </p>
            <p className="mt-1 font-mono text-sm font-bold">{order.reference}</p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Customer</dt>
            <dd className="mt-0.5 font-semibold">{customer?.full_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Delivered on</dt>
            <dd className="mt-0.5 font-semibold">{formatDateTime(deliveredAt)} (IST)</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Order placed</dt>
            <dd className="mt-0.5 font-semibold">{formatDateTime(order.created_at)} (IST)</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Delivery method</dt>
            <dd className="mt-0.5 font-semibold">
              {order.delivery_method === "cash" ? "Cash delivery" : "Bank transfer"}
            </dd>
          </div>
        </dl>

        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-2.5">Amount sent ({order.send_currency})</td>
              <td className="py-2.5 text-right font-semibold">
                {formatMoney(Number(order.send_amount), order.send_currency)}
              </td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2.5">
                Exchange rate applied (1 {order.send_currency} → {order.receive_currency})
              </td>
              <td className="py-2.5 text-right font-mono">
                {Number(order.rate_used).toLocaleString("en-US", {
                  maximumSignificantDigits: 6,
                })}
              </td>
            </tr>
            <tr>
              <td className="py-3 font-bold">Amount delivered ({order.receive_currency})</td>
              <td className="py-3 text-right text-lg font-black text-emerald-600">
                {formatMoney(Number(order.receive_amount), order.receive_currency)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 rounded-lg bg-slate-50 p-4 text-xs text-slate-600 print:border print:border-slate-200">
          <p className="font-semibold uppercase tracking-wide text-slate-500">
            Delivered to
          </p>
          <p className="mt-1">
            {Object.entries(details)
              .filter(([, v]) => v)
              .map(([k, v]) => `${k.replaceAll("_", " ")}: ${v}`)
              .join(" · ")}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-500">
          <span>
            Status: <span className="font-bold text-emerald-600">DELIVERED ✓</span>
          </span>
          <span>Generated by AlphaPay · {formatDateTime(new Date().toISOString())} IST</span>
        </div>
      </div>

      <div className="mt-6 space-y-3 print:hidden">
        <PrintButton />
        <p className="text-center text-xs text-muted">
          “Download PDF” opens your device&apos;s print screen — choose “Save as
          PDF” to keep or share the receipt.
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
