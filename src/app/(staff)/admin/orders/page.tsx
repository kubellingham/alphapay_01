import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { createClient } from "@/lib/supabase/server";
import {
  STATUS_INFO,
  formatDateTime,
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

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "under_review" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status !== "all") query = query.eq("status", status);
  const { data } = await query;
  const orders = (data ?? []) as Order[];

  const { data: countsData } = await supabase.from("orders").select("status");
  const counts = new Map<string, number>();
  for (const row of countsData ?? []) {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const count =
            f === "all"
              ? (countsData?.length ?? 0)
              : (counts.get(f) ?? 0);
          const active = status === f;
          return (
            <Link
              key={f}
              href={`/admin/orders?status=${f}`}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                active
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-edge text-muted hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : STATUS_INFO[f].label} · {count}
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">
          No orders in this state.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-edge">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Receives</th>
                <th className="px-4 py-3">Sender pays</th>
                <th className="px-4 py-3">Delivery</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-edge hover:bg-surface">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono font-semibold text-accent hover:underline"
                    >
                      {order.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {formatMoney(Number(order.receive_amount), order.receive_currency)}
                  </td>
                  <td className="px-4 py-3">
                    {formatMoney(Number(order.send_amount), order.send_currency)}
                  </td>
                  <td className="px-4 py-3">
                    {order.delivery_method === "cash" ? "Cash" : "Bank"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDateTime(order.created_at)}
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
