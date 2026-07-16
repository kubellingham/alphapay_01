"use client";

import { useActionState, useState } from "react";
import { updateOrderStatus, type AdminActionState } from "@/lib/actions/admin";
import { Spinner } from "@/components/spinner";
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
        <p className="rounded-xl border border-danger/40 bg-danger-soft px-4 py-2.5 text-sm text-danger">
          {state.error}
        </p>
      )}

      {rejecting ? (
        <div className="space-y-3">
          <label className="block text-[12.5px] font-semibold text-muted">
            Reason for rejection (shown to the student)
            <textarea
              name="note"
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-edge-strong bg-surface-2 px-3.5 py-2.5 text-base outline-none"
              placeholder="e.g. The receipt amount doesn't match the order total…"
            />
          </label>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setRejecting(false)}
              className="h-11 w-1/2 rounded-xl border border-edge-strong bg-surface-2 text-sm font-bold text-muted"
            >
              Back
            </button>
            <button
              name="action"
              value="reject"
              disabled={pending}
              className="h-11 w-1/2 rounded-xl bg-danger text-sm font-bold text-danger-fg disabled:opacity-60"
            >
              {pending ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner /> Rejecting…
                </span>
              ) : (
                "Reject order"
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          {canConfirm && (
            <button
              name="action"
              value="confirm"
              disabled={pending}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-bold text-primary-fg hover:bg-primary-hover disabled:opacity-60"
            >
              {pending ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner /> Working…
                </span>
              ) : (
                <>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Confirm payment
                </>
              )}
            </button>
          )}
          {canDeliver && (
            <button
              name="action"
              value="deliver"
              disabled={pending}
              className="flex h-11 flex-1 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-fg hover:bg-primary-hover disabled:opacity-60"
            >
              {pending ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner /> Working…
                </span>
              ) : (
                "📦 Mark delivered"
              )}
            </button>
          )}
          {canReject && (
            <button
              type="button"
              onClick={() => setRejecting(true)}
              className="h-11 flex-1 rounded-xl border border-danger bg-danger-soft text-sm font-bold text-danger"
            >
              Reject with note…
            </button>
          )}
        </div>
      )}
    </form>
  );
}
