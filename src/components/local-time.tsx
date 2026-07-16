"use client";

import { useSyncExternalStore } from "react";
import { formatDateTime } from "@/lib/types";

const subscribe = () => () => {};

/**
 * Renders a timestamp in the viewer's own timezone. During server rendering
 * (and for users whose device timezone is unavailable) it falls back to IST.
 */
export function LocalTime({ iso }: { iso: string }) {
  const text = useSyncExternalStore(
    subscribe,
    () => formatDateTime(iso, Intl.DateTimeFormat().resolvedOptions().timeZone),
    () => formatDateTime(iso),
  );
  return <time dateTime={iso} suppressHydrationWarning>{text}</time>;
}
