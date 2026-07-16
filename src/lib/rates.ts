import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Direction, Rate } from "@/lib/types";

export type RatesByPair = Partial<Record<Direction, Rate>>;

/**
 * How old a stored rate may get before a page view triggers a refresh.
 * With a live source (Wise) connected: 2 minutes. Fallback feed: 1 hour
 * (it only publishes daily, so hammering it buys nothing).
 */
const RATE_MAX_AGE_MS = process.env.WISE_API_TOKEN
  ? 2 * 60 * 1000
  : 60 * 60 * 1000;

/**
 * Read the current (cached) rates. Returns {} if Supabase is unreachable.
 * Stale-while-revalidate: if the stored rates are older than RATE_MAX_AGE_MS
 * and the service key is available, a background refresh is scheduled after
 * the response is sent — the current visitor gets the stored rate instantly,
 * the next one gets the fresh rate.
 */
export async function getRates(): Promise<RatesByPair> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("rates").select("*");
    if (error || !data) return {};
    const byPair: RatesByPair = {};
    let newestFetch = 0;
    for (const row of data as Rate[]) {
      byPair[row.pair] = {
        ...row,
        market_rate: Number(row.market_rate),
        margin_percent: Number(row.margin_percent),
        effective_rate: Number(row.effective_rate),
      };
      newestFetch = Math.max(newestFetch, new Date(row.fetched_at).getTime());
    }

    if (
      newestFetch > 0 &&
      Date.now() - newestFetch > RATE_MAX_AGE_MS &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      after(async () => {
        await refreshRates();
      });
    }

    return byPair;
  } catch {
    return {};
  }
}

interface ErApiResponse {
  result: string;
  rates: Record<string, number>;
}

type MarketRates = { TZS_TO_INR: number; INR_TO_TZS: number };

/**
 * Live mid-market rates from Wise — the same mid-market rate Google and XE
 * display, refreshed by Wise every few minutes. Needs WISE_API_TOKEN (free
 * personal token from a Wise account).
 */
async function fetchFromWise(token: string): Promise<MarketRates> {
  const get = async (source: string, target: string) => {
    const res = await fetch(
      `https://api.wise.com/v1/rates?source=${source}&target=${target}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!res.ok) throw new Error(`Wise API responded ${res.status}`);
    const body = (await res.json()) as { rate: number }[];
    const rate = body?.[0]?.rate;
    if (!rate || rate <= 0) throw new Error(`Wise returned no ${source}/${target} rate`);
    return rate;
  };
  const [tzsToInr, inrToTzs] = await Promise.all([
    get("TZS", "INR"),
    get("INR", "TZS"),
  ]);
  return { TZS_TO_INR: tzsToInr, INR_TO_TZS: inrToTzs };
}

/** Fallback: free daily feed, USD crosses. No key needed. */
async function fetchFromErApi(): Promise<MarketRates> {
  const res = await fetch("https://open.er-api.com/v6/latest/USD", {
    // Never serve this from the fetch cache — freshness is the whole point.
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`FX API responded ${res.status}`);
  const body = (await res.json()) as ErApiResponse;
  if (body.result !== "success") throw new Error("FX API returned an error");

  const tzsPerUsd = body.rates["TZS"];
  const inrPerUsd = body.rates["INR"];
  if (!tzsPerUsd || !inrPerUsd) throw new Error("FX API missing TZS or INR");

  return {
    TZS_TO_INR: inrPerUsd / tzsPerUsd,
    INR_TO_TZS: tzsPerUsd / inrPerUsd,
  };
}

/**
 * Fetch market rates: Wise (live, minutes-fresh) when a token is configured,
 * with the daily feed as automatic fallback so rates never go dark.
 */
export async function fetchMarketRates(): Promise<MarketRates> {
  const wiseToken = process.env.WISE_API_TOKEN;
  if (wiseToken) {
    try {
      return await fetchFromWise(wiseToken);
    } catch {
      // Wise hiccup — fall through to the daily feed rather than failing.
    }
  }
  return fetchFromErApi();
}

/**
 * Pull fresh market rates and store them. Shared by the daily cron, the
 * stale-while-revalidate path in getRates(), and the staff "Refresh now"
 * button. Never throws. Margins are left untouched.
 */
export async function refreshRates(): Promise<{
  ok: boolean;
  market?: { TZS_TO_INR: number; INR_TO_TZS: number };
  error?: string;
}> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is not set" };
  }

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const market = await fetchMarketRates();
    const supabase = createAdminClient();
    const now = Date.now();
    // Concurrent refreshes (several visitors hitting a stale rate at once)
    // no-op after the first one lands, thanks to the fetched_at guard.
    const cutoff = new Date(now - 60 * 1000).toISOString();

    for (const [pair, marketRate] of Object.entries(market)) {
      const { error } = await supabase
        .from("rates")
        .update({
          market_rate: marketRate,
          fetched_at: new Date(now).toISOString(),
        })
        .eq("pair", pair)
        .lt("fetched_at", cutoff);
      if (error) throw new Error(error.message);
    }

    return { ok: true, market };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
