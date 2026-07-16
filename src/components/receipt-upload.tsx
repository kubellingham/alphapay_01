"use client";

import { useActionState } from "react";
import { uploadReceipt, type OrderActionState } from "@/lib/actions/orders";
import { Spinner } from "@/components/spinner";

export function ReceiptUpload({
  orderId,
  label = "Submit receipt for review",
}: {
  orderId: string;
  label?: string;
}) {
  const [state, formAction, pending] = useActionState<OrderActionState, FormData>(
    uploadReceipt,
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="order_id" value={orderId} />
      <input
        type="file"
        name="receipt"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        required
        className="block w-full rounded-xl border border-edge bg-background text-sm text-muted file:mr-3 file:rounded-l-xl file:border-0 file:bg-surface-2 file:px-4 file:py-3 file:font-semibold file:text-foreground"
      />
      {state.error && (
        <p className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-xl bg-accent py-3 font-bold text-background disabled:opacity-60"
      >
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <Spinner /> Uploading…
          </span>
        ) : (
          label
        )}
      </button>
    </form>
  );
}
