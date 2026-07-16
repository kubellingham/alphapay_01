import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { getUserAndProfile } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";

export async function Nav() {
  const { user, profile } = await getUserAndProfile();
  const isStaff = profile?.role === "staff" || profile?.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
          <LogoMark size={30} />
          AlphaPay
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto whitespace-nowrap text-sm">
          <Link
            href="/"
            className="rounded-lg px-3 py-1.5 font-semibold text-muted hover:bg-surface-2 hover:text-foreground"
          >
            Convert
          </Link>
          {user && (
            <Link
              href="/orders"
              className="rounded-lg px-3 py-1.5 font-semibold text-muted hover:bg-surface-2 hover:text-foreground"
            >
              My orders
            </Link>
          )}
          {isStaff && (
            <Link
              href="/admin"
              className="rounded-lg px-3 py-1.5 font-semibold text-accent hover:bg-surface-2"
            >
              Staff
            </Link>
          )}
          {user ? (
            <div className="ml-1 flex items-center gap-2">
              <Link
                href="/profile"
                className="hidden rounded-lg px-3 py-1.5 font-semibold text-muted hover:bg-surface-2 hover:text-foreground sm:block"
              >
                {profile?.full_name?.split(" ")[0] ?? "Profile"}
              </Link>
              <form action={signOut}>
                <button className="rounded-[10px] border border-edge-strong bg-surface-2 px-3 py-1.5 font-bold text-foreground hover:border-edge-strong">
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-1 rounded-[10px] bg-primary px-3.5 py-1.5 font-bold text-primary-fg hover:bg-primary-hover"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
