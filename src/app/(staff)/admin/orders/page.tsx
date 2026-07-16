import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { LocalTime } from "@/components/local-time";
import { StatusBadge } from "@/components/status-badge";
import { createClient } from "@/lib/supabase/server";
import {
  STATUS_INFO,
  formatMoney,
  type Order,
  type OrderStatus,
} from "@/lib/types";

export const metadata = { title: "Order queue" };
export const dynamic = "force-dynamic";

const FILTERS: (OrderStatus | "all")[] = [
  "under_review",
  "awaiting_payment",
  "confirmed",
  "delivered",
  "rejected",
  "cancelled",
  "all",
];

const FILTER_TEXT: Record<string, string> = {
  under_review: "text-info",
  awaiting_payment: "text-warning",
  confirmed: "text-primary",
  delivered: "text-success",
  rejected: "text-danger",
  cancelled: "text-muted",
  all: "text-foreground",
};

type OrderWithProfile = Order & { profiles: { full_name: string | null } | null };

/** The name typed on the order (recipient / account holder) — never the Google name. */
function orderName(order: OrderWithProfile): string {
  const d = order.delivery_details as unknown as Record<string, string>;
  return d.recipient_name || d.account_name || order.profiles?.full_name || "—";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "under_review" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("*, profiles:user_id(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status !== "all") query = query.eq("status", status);
  const { data } = await query;
  const orders = (data ?? []) as unknown as OrderWithProfile[];

  const { data: countsData } = await supabase.from("orders").select("status");
  const counts = new Map<string, number>();
  for (const row of countsData ?? []) {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  }

  return (
    <div>
      <AutoRefresh intervalMs={15000} />
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = f === "all" ? (countsData?.length ?? 0) : (counts.get(f) ?? 0);
          const active = status === f;
          return (
            <Link
              key={f}
              href={`/admin/orders?status=${f}`}
              className={`flex h-[34px] items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold ${
                active
                  ? "bg-primary text-primary-fg"
                  : `border border-edge-strong bg-surface-2 ${FILTER_TEXT[f]}`
              }`}
            >
              {f === "all" ? "All" : STATUS_INFO[f].label}
              <span className="opacity-70">{count}</span>
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted">No orders in this state.</p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-edge bg-surface">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[.06em] text-muted">
                <th className="px-4 pb-2.5 pt-4 font-semibold">Ref</th>
                <th className="px-4 pb-2.5 pt-4 font-semibold">Recipient</th>
                <th className="px-4 pb-2.5 pt-4 font-semibold">Direction</th>
                <th className="px-4 pb-2.5 pt-4 font-semibold">Sends</th>
                <th className="px-4 pb-2.5 pt-4 font-semibold">Placed</th>
                <th className="px-4 pb-2.5 pt-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className={`border-t border-edge hover:bg-surface-2 ${
                    ["rejected", "cancelled"].includes(order.status) ? "opacity-75" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono text-[13px] font-semibold text-primary hover:underline"
                    >
                      {order.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-semibold">{orderName(order)}</td>
                  <td className="px-4 py-3 text-[13px] text-muted">
                    {order.send_currency} → {order.receive_currency}
                  </td>
                  <td className="px-4 py-3">
                    {formatMoney(Number(order.send_amount), order.send_currency)}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-muted">
                    <LocalTime iso={order.created_at} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
