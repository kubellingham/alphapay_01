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
          className="mt-1 w-full rounded-xl border border-edge bg-background px-3 py-3 outline-none focus:border-accent"
        />
      </label>
      <label className="block text-sm font-medium">
        Phone number
        <input
          name="phone"
          defaultValue={phone}
          inputMode="tel"
          placeholder="+91 98765 43210"
          className="mt-1 w-full rounded-xl border border-edge bg-background px-3 py-3 outline-none focus:border-accent"
        />
        <span className="mt-1 block text-xs text-muted">
          Our team uses this to coordinate your deliveries.
        </span>
      </label>

      {state.error && (
        <p className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.saved && !state.error && (
        <p className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm text-accent">
          Profile saved.
        </p>
      )}

      <button
        disabled={pending}
        className="w-full rounded-xl bg-accent py-3 font-bold text-background disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
