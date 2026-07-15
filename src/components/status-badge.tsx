import { STATUS_INFO, type OrderStatus } from "@/lib/types";

const TONE_CLASSES = {
  pending: "bg-warning/15 text-warning",
  good: "bg-accent/15 text-accent",
  bad: "bg-danger/15 text-danger",
} as const;

export function StatusBadge({ status }: { status: OrderStatus }) {
  const info = STATUS_INFO[status];
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASSES[info.tone]}`}
    >
      {info.label}
    </span>
  );
}
