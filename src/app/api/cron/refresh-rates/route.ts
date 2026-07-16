import { NextResponse } from "next/server";
import { refreshRates } from "@/lib/rates";

export const dynamic = "force-dynamic";

/**
 * Refreshes market rates from the FX API. Wired to a daily Vercel cron
 * (see vercel.json) as a zero-traffic backstop — page views also refresh
 * stale rates via getRates(). Protected by CRON_SECRET when set (Vercel
 * sends it as a Bearer token automatically).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await refreshRates();
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
