"use client";

import { useActionState, useMemo, useState } from "react";
import type { RatesByPair } from "@/lib/rates";
import { createOrder, type OrderActionState } from "@/lib/actions/orders";
import { Spinner } from "@/components/spinner";
import {
  DIRECTION_INFO,
  formatMoney,
  type DeliveryMethod,
  type Direction,
} from "@/lib/types";

const inputClass =
  "mt-1.5 h-12 w-full rounded-xl border border-edge-strong bg-surface-2 px-3.5 text-base outline-none";
const labelClass = "block text-[12.5px] font-semibold text-muted";
const FLAGS: Record<string, string> = { TZS: "🇹🇿", INR: "🇮🇳" };

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-5 flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-[5px] flex-1 rounded-[3px] ${i <= step ? "bg-primary" : "bg-surface-3"}`}
        />
      ))}
    </div>
  );
}

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
  const canLeaveAmount = receiveAmount > 0 && Boolean(rate);

  return (
    <form action={formAction}>
      <ProgressBar step={step} />

      {/* Step 1: amount */}
      <section className={step === 0 ? "space-y-4" : "hidden"}>
        <div>
          <p className="text-[12.5px] font-bold uppercase tracking-wide text-primary">
            Step 1 of 3
          </p>
          <h2 className="mt-1 text-[22px] font-extrabold tracking-tight">
            How much should arrive?
          </h2>
        </div>

        <input type="hidden" name="direction" value={direction} />
        <div className="flex gap-1 rounded-xl bg-surface-2 p-1 text-[13px] font-bold">
          {(Object.keys(DIRECTION_INFO) as Direction[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDirection(d)}
              className={`h-9 flex-1 rounded-[10px] transition ${
                direction === d ? "bg-surface shadow" : "text-muted"
              }`}
            >
              {DIRECTION_INFO[d].label}
            </button>
          ))}
        </div>

        <label className="block rounded-[14px] border border-edge-strong bg-surface-2 px-3.5 py-3">
          <span className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">They receive</span>
            <span className="text-[13px] font-bold">
              {FLAGS[info.receive]} {info.receive}
            </span>
          </span>
          <input
            name="receive_amount"
            inputMode="decimal"
            value={receiveText}
            onChange={(e) => setReceiveText(e.target.value)}
            placeholder="0"
            className="mt-1 w-full border-none bg-transparent text-[26px] font-bold outline-none"
          />
        </label>

        <div className="rounded-[14px] border border-edge-strong bg-surface-2 px-3.5 py-3">
          <span className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">You send</span>
            <span className="text-[13px] font-bold">
              {FLAGS[info.send]} {info.send}
            </span>
          </span>
          <p className="mt-1 text-[26px] font-bold">
            {sendAmount > 0 ? formatMoney(sendAmount, info.send) : "—"}
          </p>
        </div>

        {rate ? (
          <div className="flex items-center gap-2.5 rounded-xl bg-accent-soft px-3.5 py-3 text-[12.5px]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-none" aria-hidden>
              <path
                d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"
                stroke="var(--accent)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <span>
              Rate{" "}
              <b className="font-mono text-accent">
                1 {info.send} ={" "}
                {rate.effective_rate.toLocaleString("en-US", {
                  maximumSignificantDigits: 6,
                })}{" "}
                {info.receive}
              </b>{" "}
              is locked when you place the order.
            </span>
          </div>
        ) : (
          <p className="text-sm text-warning">Rates are unavailable right now.</p>
        )}

        <button
          type="button"
          disabled={!canLeaveAmount}
          onClick={() => setStep(1)}
          className="h-[52px] w-full rounded-[14px] bg-primary text-base font-bold text-primary-fg hover:bg-primary-hover disabled:bg-surface-3 disabled:text-faint"
        >
          Continue
        </button>
      </section>

      {/* Step 2: delivery */}
      <section className={step === 1 ? "space-y-4" : "hidden"}>
        <div>
          <p className="text-[12.5px] font-bold uppercase tracking-wide text-primary">
            Step 2 of 3
          </p>
          <h2 className="mt-1 text-[22px] font-extrabold tracking-tight">
            Where should we deliver?
          </h2>
        </div>

        <input type="hidden" name="delivery_method" value={method} />
        <div className="flex gap-2">
          {(
            [
              { key: "cash", label: "Cash to address" },
              { key: "bank", label: "Bank transfer" },
            ] as const
          ).map((option) => {
            const active = method === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setMethod(option.key)}
                className={`flex-1 rounded-xl border p-3 text-left text-[13.5px] font-bold transition ${
                  active
                    ? "border-primary bg-primary-soft"
                    : "border-edge-strong bg-surface-2 text-muted"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`grid h-4 w-4 flex-none place-items-center rounded-full border-2 ${
                      active ? "border-primary" : "border-edge-strong"
                    }`}
                  >
                    {active && <span className="h-[7px] w-[7px] rounded-full bg-primary" />}
                  </span>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>

        {method === "cash" ? (
          <div className="space-y-3.5">
            <label className={labelClass}>
              Recipient full name
              <input name="recipient_name" className={inputClass} placeholder="As on their ID" />
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
          <div className="space-y-3.5">
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
            <input name="phone" inputMode="tel" placeholder="+91 98765 43210" className={inputClass} />
          </label>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep(0)}
            className="h-[52px] w-1/3 rounded-[14px] border border-edge-strong bg-surface-2 font-bold text-muted"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="h-[52px] w-2/3 rounded-[14px] bg-primary text-base font-bold text-primary-fg hover:bg-primary-hover"
          >
            Review order
          </button>
        </div>
      </section>

      {/* Step 3: review + submit */}
      <section className={step === 2 ? "space-y-4" : "hidden"}>
        <div>
          <p className="text-[12.5px] font-bold uppercase tracking-wide text-primary">
            Step 3 of 3
          </p>
          <h2 className="mt-1 text-[22px] font-extrabold tracking-tight">Review &amp; place</h2>
        </div>

        <div className="rounded-2xl border border-edge bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted">You send</span>
            <span className="text-lg font-extrabold">
              {sendAmount > 0 ? formatMoney(sendAmount, info.send) : "—"}
            </span>
          </div>
          <div className="my-3 h-px bg-edge" />
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted">They receive</span>
            <span className="text-lg font-extrabold text-primary">
              {receiveAmount > 0 ? formatMoney(receiveAmount, info.receive) : "—"}
            </span>
          </div>
          <div className="my-3 h-px bg-edge" />
          <div className="flex items-center justify-between text-[12.5px]">
            <span className="text-muted">Locked rate</span>
            <span className="font-mono font-semibold text-accent">
              1 {info.send} ={" "}
              {rate?.effective_rate.toLocaleString("en-US", { maximumSignificantDigits: 6 })}{" "}
              {info.receive}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-edge bg-surface p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Delivery</p>
          <p className="mt-2 text-sm font-semibold">
            {method === "cash" ? "Cash to their address" : "Bank transfer"}
          </p>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl bg-info-soft px-3.5 py-3 text-[12.5px] leading-relaxed">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke="var(--info)" strokeWidth="1.7" />
            <path d="M12 8h.01M11 12h1v4h1" stroke="var(--info)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Next you&apos;ll get our account details to pay. Delivery starts once we
          verify your payment — the final send amount is computed the moment
          you place the order.
        </div>

        {state.error && (
          <p className="rounded-xl border border-danger/40 bg-danger-soft px-4 py-2.5 text-sm text-danger">
            {state.error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="h-[52px] w-1/3 rounded-[14px] border border-edge-strong bg-surface-2 font-bold text-muted"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={pending}
            className="h-[52px] w-2/3 rounded-[14px] bg-primary text-base font-bold text-primary-fg hover:bg-primary-hover disabled:opacity-60"
          >
            {pending ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> Placing…
              </span>
            ) : (
              "Place order"
            )}
          </button>
        </div>
      </section>
    </form>
  );
}
