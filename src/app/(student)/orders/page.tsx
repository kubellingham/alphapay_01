import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, type Order } from "@/lib/types";
import { LocalTime } from "@/components/local-time";

export const metadata = { title: "My orders" };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as Order[];

  return (
    <div>
      <AutoRefresh intervalMs={15000} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My orders</h1>
        <Link
          href="/order/new"
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-background hover:bg-accent-strong"
        >
          New order
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-edge bg-surface p-8 text-center">
          <p className="text-3xl">💸</p>
          <p className="mt-3 font-semibold">No orders yet</p>
          <p className="mt-1 text-sm text-muted">
            Start with the converter and place your first transfer.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-accent px-4 py-2 font-semibold text-background"
          >
            Check today&apos;s rate
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/orders/${order.id}`}
                className="block rounded-2xl border border-edge bg-surface p-4 hover:border-accent/50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted">{order.reference}</span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-lg font-bold">
                    {formatMoney(Number(order.receive_amount), order.receive_currency)}
                  </span>
                  <span className="text-xs text-muted">
                    from {formatMoney(Number(order.send_amount), order.send_currency)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {order.delivery_method === "cash" ? "Cash delivery" : "Bank transfer"} ·{" "}
                  <LocalTime iso={order.created_at} />
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
