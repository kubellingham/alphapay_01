import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/env";

/**
 * Service-role client. Bypasses RLS — only for trusted server-side jobs
 * (the rate-refresh cron). Never expose to the browser.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createSupabaseClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
