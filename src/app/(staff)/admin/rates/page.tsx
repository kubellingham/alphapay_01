import { MarginForm } from "@/components/margin-form";
import { requireStaff } from "@/lib/auth";
import { getRates } from "@/lib/rates";
import { DIRECTION_INFO, formatDateTime, type Direction } from "@/lib/types";

export const metadata = { title: "Rates" };
export const dynamic = "force-dynamic";

export default async function AdminRatesPage() {
  const { profile } = await requireStaff();
  const rates = await getRates();
  const isAdmin = profile.role === "admin";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {(Object.keys(DIRECTION_INFO) as Direction[]).map((pair) => {
        const rate = rates[pair];
        const info = DIRECTION_INFO[pair];
        return (
          <section key={pair} className="rounded-2xl border border-edge bg-surface p-5">
            <h2 className="font-bold">
              {info.send} → {info.receive}
            </h2>
            {rate ? (
              <>
                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted">Market rate</dt>
                    <dd className="font-mono">
                      {rate.market_rate.toLocaleString("en-US", {
                        maximumSignificantDigits: 6,
                      })}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Customer rate (after margin)</dt>
                    <dd className="font-mono font-bold text-accent">
                      {rate.effective_rate.toLocaleString("en-US", {
                        maximumSignificantDigits: 6,
                      })}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Last market refresh</dt>
                    <dd>{formatDateTime(rate.fetched_at)}</dd>
                  </div>
                </dl>
                <MarginForm
                  pair={pair}
                  currentMargin={rate.margin_percent}
                  disabled={!isAdmin}
                />
              </>
            ) : (
              <p className="mt-3 text-sm text-warning">
                No rate stored yet — run the refresh cron or check the Supabase
                connection.
              </p>
            )}
          </section>
        );
      })}
      <p className="text-xs text-muted md:col-span-2">
        Market rates refresh hourly from the FX feed (open.er-api.com). The
        customer rate is the market rate minus the margin — the margin is
        AlphaPay&apos;s revenue on each transfer. Rates on existing orders are never
        affected.
      </p>
    </div>
  );
}
