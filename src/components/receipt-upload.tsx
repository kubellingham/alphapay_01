"use client";

import { useActionState, useRef, useState } from "react";
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
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="order_id" value={orderId} />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-[14px] border-[1.5px] border-dashed border-edge-strong bg-surface-2 px-4 py-5 text-center hover:border-primary"
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          className="mx-auto mb-1.5"
          aria-hidden
        >
          <path
            d="M12 16V4m0 0L8 8m4-4l4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"
            stroke="var(--primary)"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="block text-[13px] font-semibold">
          {fileName ?? "Tap to choose a photo or PDF"}
        </span>
        <span className="mt-0.5 block text-[11.5px] text-faint">
          JPG, PNG, WebP or PDF · up to 8 MB
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        name="receipt"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        required
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        className="sr-only"
      />

      {state.error && (
        <p className="rounded-xl border border-danger/40 bg-danger-soft px-4 py-2.5 text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        disabled={pending || !fileName}
        className="h-[52px] w-full rounded-[14px] bg-primary text-base font-bold text-primary-fg hover:bg-primary-hover disabled:bg-surface-3 disabled:text-faint"
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
