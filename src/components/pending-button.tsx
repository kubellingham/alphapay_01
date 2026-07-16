"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/spinner";

/**
 * Submit button that shows a spinner while its surrounding form's server
 * action is running. Drop inside any <form action={...}>.
 */
export function PendingButton({
  children,
  pendingText = "Working…",
  className = "",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className={`${className} disabled:opacity-60`}>
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Spinner /> {pendingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
