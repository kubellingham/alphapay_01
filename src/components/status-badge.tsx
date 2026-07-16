import { STATUS_INFO, type OrderStatus, type StatusTone } from "@/lib/types";

const TONE_CLASSES: Record<StatusTone, { pill: string; dot: string }> = {
  warning: { pill: "bg-warning-soft text-warning", dot: "bg-warning" },
  info: { pill: "bg-info-soft text-info", dot: "bg-info" },
  primary: { pill: "bg-primary-soft text-primary", dot: "bg-primary" },
  success: { pill: "bg-success-soft text-success", dot: "bg-success" },
  danger: { pill: "bg-danger-soft text-danger", dot: "bg-danger" },
  neutral: { pill: "bg-surface-3 text-muted", dot: "bg-faint" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const info = STATUS_INFO[status];
  const tone = TONE_CLASSES[info.tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${tone.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {info.label}
    </span>
  );
}
