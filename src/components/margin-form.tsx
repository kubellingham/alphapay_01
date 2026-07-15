"use client";

import { useActionState } from "react";
import { updateMargin, type AdminActionState } from "@/lib/actions/admin";

export function MarginForm({
  pair,
  currentMargin,
  disabled,
}: {
  pair: string;
  currentMargin: number;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    updateMargin,
    {},
  );

  return (
    <form action={formAction} className="mt-3 space-y-2">
      <input type="hidden" name="pair" value={pair} />
      <div className="flex items-center gap-2">
        <input
          name="margin_percent"
          inputMode="decimal"
          defaultValue={currentMargin}
          disabled={disabled}
          className="w-24 rounded-xl border border-edge bg-background px-3 py-2 text-right font-semibold outline-none focus:border-accent disabled:opacity-50"
        />
        <span className="text-sm text-muted">% margin</span>
        <button
          disabled={disabled || pending}
          className="ml-auto rounded-xl bg-accent px-4 py-2 text-sm font-bold text-background disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
      {state.saved && !state.error && (
        <p className="text-xs text-accent">Margin updated.</p>
      )}
      {disabled && (
        <p className="text-xs text-muted">Only admins can change margins.</p>
      )}
    </form>
  );
}
