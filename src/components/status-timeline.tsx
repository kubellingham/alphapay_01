import type { OrderEvent, OrderStatus } from "@/lib/types";
import { LocalTime } from "@/components/local-time";

/** Canonical forward path; terminal exits (rejected/cancelled) come from events. */
const FORWARD_STEPS: { status: OrderStatus; label: string; hint: string }[] = [
  { status: "awaiting_payment", label: "Awaiting your payment", hint: "Pay & upload your receipt" },
  { status: "under_review", label: "Under review", hint: "We verify the receipt" },
  { status: "confirmed", label: "Confirmed", hint: "Money on its way" },
  { status: "delivered", label: "Delivered", hint: "" },
];

type Node = {
  key: string;
  label: string;
  sub: React.ReactNode;
  kind: "done" | "bad" | "current" | "future";
};

export function StatusTimeline({
  events,
  currentStatus,
}: {
  events: OrderEvent[];
  currentStatus: OrderStatus;
}) {
  const nodes: Node[] = [];

  // Everything that actually happened, in order.
  for (const [i, event] of events.entries()) {
    const isLast = i === events.length - 1;
    const isBad = event.to_status === "rejected" || event.to_status === "cancelled";
    const label =
      event.from_status === null
        ? "Order placed"
        : (FORWARD_STEPS.find((s) => s.status === event.to_status)?.label ??
          (event.to_status === "rejected" ? "Rejected" : "Cancelled"));
    nodes.push({
      key: event.id,
      label,
      sub: (
        <>
          <LocalTime iso={event.created_at} />
          {event.note && (
            <span className="mt-1 block rounded-lg bg-surface-2 px-2 py-1 text-xs text-foreground">
              “{event.note}”
            </span>
          )}
        </>
      ),
      kind: isBad ? "bad" : isLast && !isTerminal(currentStatus) ? "current" : "done",
    });
  }

  // What still lies ahead on the happy path.
  if (!isTerminal(currentStatus)) {
    const currentIndex = FORWARD_STEPS.findIndex((s) => s.status === currentStatus);
    for (const step of FORWARD_STEPS.slice(currentIndex + 1)) {
      nodes.push({
        key: step.status,
        label: step.label,
        sub: step.hint,
        kind: "future",
      });
    }
  }

  return (
    <ol>
      {nodes.map((node, i) => (
        <li key={node.key} className="flex gap-3">
          <div className="flex flex-none flex-col items-center">
            <Dot kind={node.kind} />
            {i < nodes.length - 1 && (
              <span
                className={`w-0.5 flex-1 ${
                  node.kind === "done" ? "bg-success/60" : node.kind === "bad" ? "bg-danger/50" : "bg-edge-strong"
                }`}
                style={{ minHeight: "1.1rem" }}
              />
            )}
          </div>
          <div className="pb-4">
            <p
              className={`text-sm font-bold ${
                node.kind === "future" ? "text-muted" : node.kind === "bad" ? "text-danger" : ""
              }`}
            >
              {node.label}
            </p>
            {node.sub && <p className="mt-0.5 text-xs text-muted">{node.sub}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function isTerminal(status: OrderStatus) {
  return ["delivered", "rejected", "cancelled"].includes(status);
}

function Dot({ kind }: { kind: Node["kind"] }) {
  if (kind === "done") {
    return (
      <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-success text-xs font-extrabold text-success-fg">
        ✓
      </span>
    );
  }
  if (kind === "bad") {
    return (
      <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-danger text-xs font-extrabold text-danger-fg">
        ✕
      </span>
    );
  }
  if (kind === "current") {
    return (
      <span className="grid h-6 w-6 flex-none place-items-center rounded-full border-2 border-warning bg-surface">
        <span className="h-2 w-2 rounded-full bg-warning" />
      </span>
    );
  }
  return <span className="h-6 w-6 flex-none rounded-full border-2 border-edge-strong bg-surface" />;
}
