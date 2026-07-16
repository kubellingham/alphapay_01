import { Spinner } from "@/components/spinner";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted">
      <Spinner className="h-8 w-8 text-primary" />
      <p className="text-sm font-medium">Loading…</p>
    </div>
  );
}
