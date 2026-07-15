import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchMarketRates } from "@/lib/rates";

export const dynamic = "force-dynamic";

/**
 * Refreshes market rates from the FX API. Wired to a Vercel cron (hourly,
 * see vercel.json); can also be hit manually. Protected by CRON_SECRET when
 * set (Vercel sends it as a Bearer token automatically).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const market = await fetchMarketRates();
    const supabase = createAdminClient();
    const fetchedAt = new Date().toISOString();

    for (const [pair, marketRate] of Object.entries(market)) {
      // Update market_rate only — margin_percent stays whatever the admin set.
      const { error } = await supabase
        .from("rates")
        .update({ market_rate: marketRate, fetched_at: fetchedAt })
        .eq("pair", pair);
      if (error) throw new Error(error.message);
    }

    return NextResponse.json({ ok: true, market, fetched_at: fetchedAt });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 },
    );
  }
}
