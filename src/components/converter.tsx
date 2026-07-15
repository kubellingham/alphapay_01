"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { RatesByPair } from "@/lib/rates";
import { DIRECTION_INFO, type Direction, formatDateTime } from "@/lib/types";

function parseAmount(value: string): number {
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function formatInput(n: number): string {
  if (!n) return "";
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function Converter({
  rates,
  compact = false,
}: {
  rates: RatesByPair;
  compact?: boolean;
}) {
  const [direction, setDirection] = useState<Direction>("TZS_TO_INR");
  // The user can type in either box; the other is derived.
  const [edited, setEdited] = useState<"send" | "receive">("receive");
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

  return (
    <div className="w-full rounded-2xl border border-edge bg-surface p-5 shadow-xl shadow-black/20">
      {/* Direction toggle */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-background p-1 text-sm font-medium">
        {(Object.keys(DIRECTION_INFO) as Direction[]).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDirection(d)}
            className={`rounded-lg px-3 py-2 transition ${
              direction === d
                ? "bg-accent text-background"
                : "text-muted hover:text-foreground"
            }`}
          >
            {DIRECTION_INFO[d].label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            You receive ({info.receive})
          </span>
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-edge bg-background px-3 focus-within:border-accent">
            <input
              inputMode="decimal"
              placeholder="0"
              value={receiveValue}
              onChange={(e) => {
                setEdited("receive");
                setReceiveText(e.target.value);
              }}
              className="w-full bg-transparent py-3 text-lg font-semibold outline-none"
            />
            <span className="text-sm font-bold text-muted">{info.receive}</span>
          </div>
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Sender pays ({info.send})
          </span>
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-edge bg-background px-3 focus-within:border-accent">
            <input
              inputMode="decimal"
              placeholder="0"
              value={sendValue}
              onChange={(e) => {
                setEdited("send");
                setSendText(e.target.value);
              }}
              className="w-full bg-transparent py-3 text-lg font-semibold outline-none"
            />
            <span className="text-sm font-bold text-muted">{info.send}</span>
          </div>
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        {rate ? (
          <>
            <span>
              1 {info.send} ={" "}
              <span className="font-semibold text-foreground">
                {rate.effective_rate.toLocaleString("en-US", {
                  maximumSignificantDigits: 6,
                })}
              </span>{" "}
              {info.receive}
            </span>
            <span>Updated {formatDateTime(rate.fetched_at)}</span>
          </>
        ) : (
          <span className="text-warning">
            Rates are temporarily unavailable. Please try again shortly.
          </span>
        )}
      </div>

      {!compact && (
        <Link
          href={canContinue ? continueHref : "#"}
          aria-disabled={!canContinue}
          className={`mt-5 block rounded-xl py-3 text-center font-bold transition ${
            canContinue
              ? "bg-accent text-background hover:bg-accent-strong"
              : "pointer-events-none bg-surface-2 text-muted"
          }`}
        >
          Continue — get this money
        </Link>
      )}
    </div>
  );
}
