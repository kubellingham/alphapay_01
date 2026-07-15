"use client";

import { useActionState } from "react";
import { setUserRole, type AdminActionState } from "@/lib/actions/admin";
import type { Role } from "@/lib/types";

export function RoleSelect({
  userId,
  role,
  isSelf,
}: {
  userId: string;
  role: Role;
  isSelf: boolean;
}) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    setUserRole,
    {},
  );

  if (isSelf) {
    return <span className="text-xs font-semibold text-muted">{role} (you)</span>;
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="user_id" value={userId} />
      <select
        name="role"
        defaultValue={role}
        disabled={pending}
        className="rounded-lg border border-edge bg-background px-2 py-1 text-xs font-semibold outline-none focus:border-accent"
      >
        <option value="student">student</option>
        <option value="staff">staff</option>
        <option value="admin">admin</option>
      </select>
      <button
        disabled={pending}
        className="rounded-lg bg-accent px-2.5 py-1 text-xs font-bold text-background disabled:opacity-50"
      >
        {pending ? "…" : "Set"}
      </button>
      {state.error && <span className="text-xs text-danger">{state.error}</span>}
      {state.saved && !state.error && <span className="text-xs text-accent">✓</span>}
    </form>
  );
}
