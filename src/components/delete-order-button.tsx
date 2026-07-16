"use client";

import { useActionState, useState } from "react";
import { deleteOrder, type AdminActionState } from "@/lib/actions/admin";
import { Spinner } from "@/components/spinner";

export function DeleteOrderButton({
  orderId,
  reference,
}: {
  orderId: string;
  reference: string;
}) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    deleteOrder,
    {},
  );
  const [arming, setArming] = useState(false);

  if (!arming) {
    return (
      <button
        type="button"
        onClick={() => setArming(true)}
        className="w-full rounded-xl border border-edge py-2.5 text-sm font-semibold text-muted hover:border-danger/40 hover:text-danger"
      >
        Delete this order…
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="order_id" value={orderId} />
      <p className="text-sm text-danger">
        Permanently delete <span className="font-mono font-bold">{reference}</span>?
        This removes its history and receipt and cannot be undone.
      </p>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setArming(false)}
          className="w-1/2 rounded-xl border border-edge py-2.5 text-sm font-semibold text-muted"
        >
          Keep it
        </button>
        <button
          disabled={pending}
          className="w-1/2 rounded-xl bg-danger py-2.5 text-sm font-bold text-background disabled:opacity-60"
        >
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Spinner /> Deleting…
            </span>
          ) : (
            "Yes, delete"
          )}
        </button>
      </div>
    </form>
  );
}
