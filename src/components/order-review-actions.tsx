"use client";

import { useActionState, useState } from "react";
import { updateOrderStatus, type AdminActionState } from "@/lib/actions/admin";
import type { OrderStatus } from "@/lib/types";

export function OrderReviewActions({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    updateOrderStatus,
    {},
  );
  const [rejecting, setRejecting] = useState(false);

  const canConfirm = status === "under_review";
  const canDeliver = status === "confirmed";
  // Once payment is confirmed the only way forward is delivery.
  const canReject = ["awaiting_payment", "under_review"].includes(status);

  if (!canConfirm && !canDeliver && !canReject) return null;

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="order_id" value={orderId} />

      {state.error && (
        <p className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      {rejecting ? (
        <div className="space-y-3">
          <label className="block text-sm font-medium">
            Reason for rejection (shown to the student)
            <textarea
              name="note"
              rows={3}
              className="mt-1 w-full rounded-xl border border-edge bg-background px-3 py-2 outline-none focus:border-accent"
              placeholder="e.g. The receipt doesn't match the order amount…"
            />
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRejecting(false)}
              className="w-1/2 rounded-xl border border-edge py-2.5 text-sm font-semibold text-muted"
            >
              Back
            </button>
            <button
              name="action"
              value="reject"
              disabled={pending}
              className="w-1/2 rounded-xl bg-danger py-2.5 text-sm font-bold text-background disabled:opacity-60"
            >
              {pending ? "Rejecting…" : "Reject order"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {canConfirm && (
            <button
              name="action"
              value="confirm"
              disabled={pending}
              className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-bold text-background disabled:opacity-60"
            >
              {pending ? "Working…" : "✓ Confirm payment"}
            </button>
          )}
          {canDeliver && (
            <button
              name="action"
              value="deliver"
              disabled={pending}
              className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-bold text-background disabled:opacity-60"
            >
              {pending ? "Working…" : "📦 Mark delivered"}
            </button>
          )}
          {canReject && (
            <button
              type="button"
              onClick={() => setRejecting(true)}
              className="flex-1 rounded-xl border border-danger/40 py-2.5 text-sm font-semibold text-danger hover:bg-danger/10"
            >
              Reject…
            </button>
          )}
        </div>
      )}
    </form>
  );
}
