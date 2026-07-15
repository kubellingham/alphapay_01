"use client";

import { useActionState } from "react";
import { refreshRatesNow, type AdminActionState } from "@/lib/actions/admin";

export function RefreshRatesButton() {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    refreshRatesNow,
    {},
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <button
        disabled={pending}
        className="rounded-xl border border-edge bg-surface px-4 py-2 text-sm font-bold hover:border-accent disabled:opacity-60"
      >
        {pending ? "Fetching latest rates…" : "⟳ Refresh rates now"}
      </button>
      {state.saved && !state.error && (
        <span className="text-sm text-accent">Rates updated to the latest market values.</span>
      )}
      {state.error && <span className="text-sm text-danger">{state.error}</span>}
    </form>
  );
}
