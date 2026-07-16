import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { LocalTime } from "@/components/local-time";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, type Order } from "@/lib/types";

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
        <h1 className="text-xl font-extrabold tracking-tight">My orders</h1>
        <Link
          href="/order/new"
          className="flex h-10 items-center gap-1.5 rounded-[11px] bg-primary px-4 text-sm font-bold text-primary-fg hover:bg-primary-hover"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          New
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center px-3 py-16 text-center">
          <div className="mb-4 grid h-[72px] w-[72px] place-items-center rounded-[20px] border border-edge bg-surface-2">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="4" y="5" width="16" height="15" rx="2.5" stroke="var(--muted)" strokeWidth="1.6" />
              <path d="M8 3v4M16 3v4M8 12h8M8 16h5" stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-lg font-extrabold">No orders yet</p>
          <p className="mt-2 max-w-[26ch] text-sm leading-relaxed text-muted">
            When you send money, your transfers will show up here so you can
            track every step.
          </p>
          <Link
            href="/"
            className="mt-6 flex h-[50px] items-center rounded-[14px] bg-primary px-6 text-[15px] font-bold text-primary-fg hover:bg-primary-hover"
          >
            Start a transfer
          </Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/orders/${order.id}`}
                className={`block rounded-2xl border border-edge bg-surface p-4 hover:border-edge-strong ${
                  ["rejected", "cancelled"].includes(order.status) ? "opacity-80" : ""
                }`}
              >
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <span className="font-mono text-[13px] text-muted">{order.reference}</span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-extrabold">
                    {formatMoney(Number(order.send_amount), order.send_currency)}
                  </span>
                  <span className="text-[13px] text-muted">
                    → {formatMoney(Number(order.receive_amount), order.receive_currency)}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-faint">
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
