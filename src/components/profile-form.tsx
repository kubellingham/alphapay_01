"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileActionState } from "@/lib/actions/profile";

export function ProfileForm({
  fullName,
  phone,
}: {
  fullName: string;
  phone: string;
}) {
  const [state, formAction, pending] = useActionState<ProfileActionState, FormData>(
    updateProfile,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-sm font-medium">
        Full name
        <input
          name="full_name"
          defaultValue={fullName}
          className="mt-1.5 h-12 w-full rounded-xl border border-edge-strong bg-surface-2 px-3.5 text-base outline-none"
        />
      </label>
      <label className="block text-sm font-medium">
        Phone number
        <input
          name="phone"
          defaultValue={phone}
          inputMode="tel"
          placeholder="+91 98765 43210"
          className="mt-1.5 h-12 w-full rounded-xl border border-edge-strong bg-surface-2 px-3.5 text-base outline-none"
        />
        <span className="mt-1 block text-xs text-muted">
          Our team uses this to coordinate your deliveries.
        </span>
      </label>

      {state.error && (
        <p className="rounded-lg border border-danger/40 bg-danger-soft px-4 py-2.5 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.saved && !state.error && (
        <p className="rounded-lg border border-success/40 bg-success-soft px-4 py-2.5 text-sm text-success">
          Profile saved.
        </p>
      )}

      <button
        disabled={pending}
        className="h-[52px] w-full rounded-[14px] bg-primary text-base font-bold text-primary-fg hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
