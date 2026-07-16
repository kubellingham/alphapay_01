"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { RatesByPair } from "@/lib/rates";
import { DIRECTION_INFO, type Direction } from "@/lib/types";
import { LocalTime } from "@/components/local-time";

function parseAmount(value: string): number {
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function formatInput(n: number): string {
  if (!n) return "";
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

const FLAGS: Record<string, string> = { TZS: "🇹🇿", INR: "🇮🇳" };

export function Converter({ rates }: { rates: RatesByPair }) {
  const [direction, setDirection] = useState<Direction>("TZS_TO_INR");
  // The user can type in either box; the other is derived.
  const [edited, setEdited] = useState<"send" | "receive">("send");
  const [sendText, setSendText] = useState("");
  const [receiveText, setReceiveText] = useState("");

  const rate = rates[direction];
  const info = DIRECTION_INFO[direction];

  const { sendAmount, receiveAmount } = useMemo(() => {
    if (!rate) return { sendAmount: 0, receiveAmount: 0 };
    if (edited === "receive") {
      const receive = parseAmount(receiveText);
      return { receiveAmount: receive, sendAmount: receive / rate.effective_rate };
    }
    const send = parseAmount(sendText);
    return { sendAmount: send, receiveAmount: send * rate.effective_rate };
  }, [rate, edited, sendText, receiveText]);

  const sendValue = edited === "send" ? sendText : formatInput(sendAmount);
  const receiveValue = edited === "receive" ? receiveText : formatInput(receiveAmount);

  const canContinue = receiveAmount > 0 && Boolean(rate);
  const continueHref = `/order/new?direction=${direction}&receive=${receiveAmount.toFixed(2)}`;

  const swap = () =>
    setDirection((d) => (d === "TZS_TO_INR" ? "INR_TO_TZS" : "TZS_TO_INR"));

  return (
    <div className="w-full overflow-hidden rounded-[20px] border border-edge bg-surface shadow-float">
      {/* Direction tabs */}
      <div className="flex gap-1 border-b border-edge bg-surface-2 p-1.5">
        {(Object.keys(DIRECTION_INFO) as Direction[]).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDirection(d)}
            className={`h-9 flex-1 rounded-[10px] text-[13px] font-bold transition ${
              direction === d ? "bg-surface text-foreground shadow" : "text-muted"
            }`}
          >
            {DIRECTION_INFO[d].label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5 p-4 pb-[18px]">
        {/* Receive — the currency you asked for sits on top */}
        <label className="block rounded-[14px] border border-edge-strong bg-surface-2 px-3.5 py-3">
          <span className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Receive</span>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-bold">
              {FLAGS[info.receive]} {info.receive}
            </span>
          </span>
          <input
            inputMode="decimal"
            placeholder="0"
            value={receiveValue}
            onChange={(e) => {
              setEdited("receive");
              setReceiveText(e.target.value);
            }}
            className="mt-1 w-full border-none bg-transparent text-[26px] font-bold outline-none"
          />
        </label>

        {/* Swap */}
        <div className="flex items-center gap-2.5">
          <span className="h-px flex-1 bg-edge" />
          <button
            type="button"
            onClick={swap}
            aria-label="Swap direction"
            className="grid h-9 w-9 flex-none place-items-center rounded-[11px] border border-edge-strong bg-surface text-primary hover:border-primary"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M7 4v14m0 0l-3-3m3 3l3-3M17 20V6m0 0l-3 3m3-3l3 3"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <span className="h-px flex-1 bg-edge" />
        </div>

        {/* Send */}
        <label className="block rounded-[14px] border border-edge-strong bg-surface-2 px-3.5 py-3">
          <span className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Send</span>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-bold">
              {FLAGS[info.send]} {info.send}
            </span>
          </span>
          <input
            inputMode="decimal"
            placeholder="0"
            value={sendValue}
            onChange={(e) => {
              setEdited("send");
              setSendText(e.target.value);
            }}
            className="mt-1 w-full border-none bg-transparent text-[26px] font-bold outline-none"
          />
        </label>

        {/* Rate line */}
        <div className="flex items-center justify-between px-0.5 pt-0.5">
          {rate ? (
            <>
              <span className="flex items-center gap-1.5 text-[12.5px] text-muted">
                <span className="h-[7px] w-[7px] rounded-full bg-success" />1 {info.send} ={" "}
                <span className="font-mono font-bold text-accent">
                  {rate.effective_rate.toLocaleString("en-US", {
                    maximumSignificantDigits: 6,
                  })}
                </span>{" "}
                {info.receive}
              </span>
              <span className="text-[11px] text-faint">
                Updated <LocalTime iso={rate.fetched_at} />
              </span>
            </>
          ) : (
            <span className="text-xs text-warning">
              Rates are temporarily unavailable. Please try again shortly.
            </span>
          )}
        </div>

        {/* CTA */}
        <Link
          href={canContinue ? continueHref : "#"}
          aria-disabled={!canContinue}
          className={`mt-1.5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] text-base font-bold transition ${
            canContinue
              ? "bg-primary text-primary-fg hover:bg-primary-hover"
              : "pointer-events-none bg-surface-3 text-faint"
          }`}
        >
          Continue
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 12h14m-6-6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
