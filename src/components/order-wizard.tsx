"use client";

import { useActionState, useMemo, useState } from "react";
import type { RatesByPair } from "@/lib/rates";
import { createOrder, type OrderActionState } from "@/lib/actions/orders";
import {
  DIRECTION_INFO,
  formatMoney,
  type DeliveryMethod,
  type Direction,
} from "@/lib/types";

const inputClass =
  "mt-1 w-full rounded-xl border border-edge bg-background px-3 py-3 outline-none focus:border-accent";
const labelClass = "block text-sm font-medium";

export function OrderWizard({
  rates,
  initialDirection,
  initialReceive,
  needsPhone,
}: {
  rates: RatesByPair;
  initialDirection: Direction;
  initialReceive: string;
  needsPhone: boolean;
}) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<Direction>(initialDirection);
  const [receiveText, setReceiveText] = useState(initialReceive);
  const [method, setMethod] = useState<DeliveryMethod>("cash");
  const [state, formAction, pending] = useActionState<OrderActionState, FormData>(
    createOrder,
    {},
  );

  const rate = rates[direction];
  const info = DIRECTION_INFO[direction];
  const receiveAmount = useMemo(() => {
    const n = Number(receiveText.replace(/,/g, ""));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [receiveText]);
  const sendAmount = rate ? receiveAmount / rate.effective_rate : 0;

  const steps = ["Amount", "Delivery", "Review"];
  const canLeaveAmount = receiveAmount > 0 && Boolean(rate);

  return (
    <form action={formAction} className="space-y-6">
      {/* Step indicator */}
      <ol className="flex items-center gap-2 text-xs font-semibold">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={`grid h-6 w-6 place-items-center rounded-full ${
                i <= step ? "bg-accent text-background" : "bg-surface-2 text-muted"
              }`}
            >
              {i + 1}
            </span>
            <span className={i <= step ? "" : "text-muted"}>{s}</span>
            {i < steps.length - 1 && <span className="w-6 border-t border-edge" />}
          </li>
        ))}
      </ol>

      {/* Step 1: amount */}
      <section className={step === 0 ? "space-y-4" : "hidden"}>
        <input type="hidden" name="direction" value={direction} />
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface p-1 text-sm font-medium">
          {(Object.keys(DIRECTION_INFO) as Direction[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDirection(d)}
              className={`rounded-lg px-3 py-2 ${
                direction === d ? "bg-accent text-background" : "text-muted"
              }`}
            >
              {DIRECTION_INFO[d].label}
            </button>
          ))}
        </div>

        <label className={labelClass}>
          Amount you want to receive ({info.receive})
          <input
            name="receive_amount"
            inputMode="decimal"
            value={receiveText}
            onChange={(e) => setReceiveText(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </label>

        <div className="rounded-xl border border-edge bg-surface p-4 text-sm">
          {rate ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted">Sender pays</span>
                <span className="font-bold">
                  {sendAmount > 0 ? formatMoney(sendAmount, info.send) : "—"}
                </span>
              </div>
              <div className="mt-1 flex justify-between text-xs text-muted">
                <span>Rate (locked at order time)</span>
                <span>
                  1 {info.send} ={" "}
                  {rate.effective_rate.toLocaleString("en-US", {
                    maximumSignificantDigits: 6,
                  })}{" "}
                  {info.receive}
                </span>
              </div>
            </>
          ) : (
            <p className="text-warning">Rates are unavailable right now.</p>
          )}
        </div>

        <button
          type="button"
          disabled={!canLeaveAmount}
          onClick={() => setStep(1)}
          className="w-full rounded-xl bg-accent py-3 font-bold text-background disabled:bg-surface-2 disabled:text-muted"
        >
          Continue
        </button>
      </section>

      {/* Step 2: delivery */}
      <section className={step === 1 ? "space-y-4" : "hidden"}>
        <input type="hidden" name="delivery_method" value={method} />
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setMethod("cash")}
            className={`rounded-lg px-3 py-2 ${
              method === "cash" ? "bg-accent text-background" : "text-muted"
            }`}
          >
            💵 Cash delivery
          </button>
          <button
            type="button"
            onClick={() => setMethod("bank")}
            className={`rounded-lg px-3 py-2 ${
              method === "bank" ? "bg-accent text-background" : "text-muted"
            }`}
          >
            🏦 Bank transfer
          </button>
        </div>

        {method === "cash" ? (
          <div className="space-y-3">
            <label className={labelClass}>
              Recipient full name
              <input name="recipient_name" className={inputClass} placeholder="As on your ID" />
            </label>
            <label className={labelClass}>
              Delivery address
              <input name="address" className={inputClass} placeholder="Street, area, hostel…" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>
                City
                <input name="city" className={inputClass} />
              </label>
              <label className={labelClass}>
                Landmark (optional)
                <input name="landmark" className={inputClass} />
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label className={labelClass}>
              Account holder name
              <input name="account_name" className={inputClass} />
            </label>
            <label className={labelClass}>
              Account number
              <input name="account_number" className={inputClass} inputMode="numeric" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>
                Bank name
                <input name="bank_name" className={inputClass} />
              </label>
              <label className={labelClass}>
                {info.receive === "INR" ? "IFSC code" : "Branch"} (optional)
                <input name="branch_or_ifsc" className={inputClass} />
              </label>
            </div>
          </div>
        )}

        {needsPhone && (
          <label className={labelClass}>
            Your phone number (for delivery updates)
            <input
              name="phone"
              inputMode="tel"
              placeholder="+91 98765 43210"
              className={inputClass}
            />
          </label>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep(0)}
            className="w-1/3 rounded-xl border border-edge py-3 font-semibold text-muted"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-2/3 rounded-xl bg-accent py-3 font-bold text-background"
          >
            Review order
          </button>
        </div>
      </section>

      {/* Step 3: review + submit */}
      <section className={step === 2 ? "space-y-4" : "hidden"}>
        <div className="space-y-2 rounded-xl border border-edge bg-surface p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">You receive</span>
            <span className="font-bold">
              {receiveAmount > 0 ? formatMoney(receiveAmount, info.receive) : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Sender pays</span>
            <span className="font-bold">
              {sendAmount > 0 ? formatMoney(sendAmount, info.send) : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Delivery</span>
            <span className="font-semibold">
              {method === "cash" ? "Cash to your address" : "Bank transfer"}
            </span>
          </div>
          <p className="border-t border-edge pt-2 text-xs text-muted">
            After you place the order, we&apos;ll show you exactly where the sender
            should pay, and you&apos;ll upload the payment receipt. The final send
            amount is computed at the moment you place the order.
          </p>
        </div>

        {state.error && (
          <p className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-1/3 rounded-xl border border-edge py-3 font-semibold text-muted"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={pending}
            className="w-2/3 rounded-xl bg-accent py-3 font-bold text-background disabled:opacity-60"
          >
            {pending ? "Placing order…" : "Place order"}
          </button>
        </div>
      </section>
    </form>
  );
}
