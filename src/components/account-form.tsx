"use client";

import { useActionState, useState } from "react";
import { saveCollectionAccount, type AdminActionState } from "@/lib/actions/admin";

const inputClass =
  "mt-1 w-full rounded-xl border border-edge bg-background px-3 py-2 outline-none focus:border-accent";
const labelClass = "block text-sm font-medium";

export function AccountForm() {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    saveCollectionAccount,
    {},
  );
  const [type, setType] = useState<"bank" | "mobile_money">("bank");

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Currency
          <select name="currency" className={inputClass}>
            <option value="TZS">TZS (Tanzania)</option>
            <option value="INR">INR (India)</option>
          </select>
        </label>
        <label className={labelClass}>
          Type
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as "bank" | "mobile_money")}
            className={inputClass}
          >
            <option value="bank">Bank account</option>
            <option value="mobile_money">Mobile money</option>
          </select>
        </label>
      </div>

      <label className={labelClass}>
        Account holder name
        <input name="account_name" className={inputClass} placeholder="AlphaPay Ltd" />
      </label>

      {type === "bank" ? (
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            Bank name
            <input name="bank_name" className={inputClass} />
          </label>
          <label className={labelClass}>
            Account number
            <input name="account_number" className={inputClass} />
          </label>
          <label className={`${labelClass} col-span-2`}>
            IFSC / UPI / branch / SWIFT (optional)
            <input name="extra" className={inputClass} />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            Provider
            <input name="provider" className={inputClass} placeholder="M-Pesa, Tigo Pesa…" />
          </label>
          <label className={labelClass}>
            Mobile number
            <input name="mobile_number" className={inputClass} inputMode="tel" />
          </label>
        </div>
      )}

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.saved && !state.error && (
        <p className="text-sm text-accent">Account added.</p>
      )}

      <button
        disabled={pending}
        className="w-full rounded-xl bg-accent py-2.5 font-bold text-background disabled:opacity-60"
      >
        {pending ? "Saving…" : "Add collection account"}
      </button>
    </form>
  );
}
