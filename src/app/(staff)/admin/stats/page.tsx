import { getRates } from "@/lib/rates";
import { createClient } from "@/lib/supabase/server";
import {
  formatMoney,
  type Currency,
  type Direction,
  type Order,
} from "@/lib/types";

export const metadata = { title: "Stats" };
export const dynamic = "force-dynamic";

/**
 * Profit per order, in the receive currency. The sender pays at the
 * margin-adjusted rate, so the margin captured is
 * receive_amount x m/(100-m). Orders from before the margin snapshot
 * existed fall back to the pair's current margin (estimate).
 */
function orderProfit(order: Order, fallbackMargin: (d: Direction) => number) {
  const m = order.margin_used != null ? Number(order.margin_used) : fallbackMargin(order.direction);
  if (m <= 0 || m >= 100) return 0;
  return Number(order.receive_amount) * (m / (100 - m));
}

export default async function AdminStatsPage() {
  const supabase = await createClient();
  const [{ data: ordersData }, rates] = await Promise.all([
    supabase.from("orders").select("*"),
    getRates(),
  ]);
  const orders = (ordersData ?? []) as Order[];
  const fallbackMargin = (d: Direction) => rates[d]?.margin_percent ?? 0;

  // eslint-disable-next-line react-hooks/purity -- server component; "now" is per-request by design
  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const settled = orders.filter((o) => ["confirmed", "delivered"].includes(o.status));
  const recent = settled.filter((o) => new Date(o.created_at).getTime() >= monthAgo);

  function summarize(list: Order[]) {
    const byCurrency = new Map<Currency, { volume: number; profit: number; count: number }>();
    for (const order of list) {
      const entry =
        byCurrency.get(order.receive_currency) ?? { volume: 0, profit: 0, count: 0 };
      entry.volume += Number(order.receive_amount);
      entry.profit += orderProfit(order, fallbackMargin);
      entry.count += 1;
      byCurrency.set(order.receive_currency, entry);
    }
    return byCurrency;
  }

  const allTime = summarize(settled);
  const last30 = summarize(recent);

  const statusCounts = new Map<string, number>();
  for (const order of orders) {
    statusCounts.set(order.status, (statusCounts.get(order.status) ?? 0) + 1);
  }

  const cards: { title: string; data: Map<Currency, { volume: number; profit: number; count: number }> }[] = [
    { title: "Last 30 days", data: last30 },
    { title: "All time", data: allTime },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map(({ title, data }) => (
          <section key={title} className="rounded-2xl border border-edge bg-surface p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-muted">
              {title} — paid &amp; delivered orders
            </h2>
            {data.size === 0 ? (
              <p className="mt-4 text-sm text-muted">No completed orders yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {[...data.entries()].map(([currency, s]) => (
                  <div key={currency} className="rounded-xl border border-edge bg-background p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted">
                      Delivering {currency} · {s.count} order{s.count === 1 ? "" : "s"}
                    </p>
                    <div className="mt-2 flex items-baseline justify-between gap-4">
                      <div>
                        <p className="text-xs text-muted">Volume delivered</p>
                        <p className="font-bold">{formatMoney(s.volume, currency)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted">Margin earned</p>
                        <p className="text-lg font-black text-accent">
                          {formatMoney(s.profit, currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      <section className="rounded-2xl border border-edge bg-surface p-5">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted">
          All orders by status
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {[...statusCounts.entries()].map(([status, count]) => (
            <span
              key={status}
              className="rounded-full border border-edge px-3 py-1 text-sm"
            >
              {status.replaceAll("_", " ")} ·{" "}
              <span className="font-bold">{count}</span>
            </span>
          ))}
          {statusCounts.size === 0 && (
            <p className="text-sm text-muted">No orders yet.</p>
          )}
        </div>
      </section>

      <p className="text-xs text-muted">
        Margin earned = the spread AlphaPay keeps on each transfer (the
        customer rate vs the market rate), counted for confirmed and delivered
        orders. It&apos;s revenue before delivery and operating costs. Older orders
        without a margin snapshot are estimated at the current margin.
      </p>
    </div>
  );
}
