import Link from "next/link";
import { requireStaff } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireStaff();

  const tabs = [
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/stats", label: "Stats" },
    { href: "/admin/rates", label: "Rates" },
    ...(profile.role === "admin"
      ? [
          { href: "/admin/accounts", label: "Accounts" },
          { href: "/admin/users", label: "Users" },
        ]
      : []),
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold tracking-tight">Staff console</h1>
        <nav className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-surface p-1 text-sm font-medium">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="rounded-[10px] px-3 py-1.5 font-bold text-muted hover:bg-surface-3 hover:text-foreground"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
