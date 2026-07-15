import {
  STATUS_INFO,
  formatDateTime,
  type OrderEvent,
  type OrderStatus,
} from "@/lib/types";

const DOT_CLASSES = {
  pending: "bg-warning",
  good: "bg-accent",
  bad: "bg-danger",
} as const;

export function StatusTimeline({ events }: { events: OrderEvent[] }) {
  return (
    <ol className="space-y-4">
      {events.map((event, i) => {
        const info = STATUS_INFO[event.to_status as OrderStatus];
        return (
          <li key={event.id} className="relative flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`mt-1 h-2.5 w-2.5 rounded-full ${DOT_CLASSES[info.tone]}`}
              />
              {i < events.length - 1 && (
                <span className="mt-1 w-px flex-1 bg-edge" />
              )}
            </div>
            <div className="pb-1">
              <p className="text-sm font-semibold">{info.label}</p>
              {event.note && (
                <p className="mt-0.5 rounded-lg bg-surface-2 px-2 py-1 text-xs">
                  “{event.note}”
                </p>
              )}
              <p className="mt-0.5 text-xs text-muted">
                {formatDateTime(event.created_at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
