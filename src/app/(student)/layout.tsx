import { requireUser } from "@/lib/auth";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return <div className="mx-auto w-full max-w-md px-4 py-8">{children}</div>;
}
