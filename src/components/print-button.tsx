"use client";

export function PrintButton({ label = "Download PDF / Print" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="w-full rounded-xl bg-accent py-3 font-bold text-background hover:bg-accent-strong print:hidden"
    >
      {label}
    </button>
  );
}
