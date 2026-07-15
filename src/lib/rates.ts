import { createClient } from "@/lib/supabase/server";
import type { Direction, Rate } from "@/lib/types";

export type RatesByPair = Partial<Record<Direction, Rate>>;

/** Read the current (cached) rates. Returns {} if Supabase is unreachable. */
export async function getRates(): Promise<RatesByPair> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("rates").select("*");
    if (error || !data) return {};
    const byPair: RatesByPair = {};
    for (const row of data as Rate[]) {
      byPair[row.pair] = {
        ...row,
        market_rate: Number(row.market_rate),
        margin_percent: Number(row.margin_percent),
        effective_rate: Number(row.effective_rate),
      };
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

/**
 * Fetch USD-based market rates and compute the TZS/INR crosses.
 * Returns units of the receive currency per 1 unit of the send currency.
 */
export async function fetchMarketRates(): Promise<{
  TZS_TO_INR: number;
  INR_TO_TZS: number;
}> {
  const res = await fetch("https://open.er-api.com/v6/latest/USD", {
    // The cron refreshes hourly; never serve this from the fetch cache.
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
