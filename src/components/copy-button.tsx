"use client";

import { useState } from "react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          // Clipboard unavailable (http / old browser) — nothing to do.
        }
      }}
      className="h-8 flex-none rounded-lg border border-primary px-3 text-xs font-bold text-primary hover:bg-primary-soft"
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}
