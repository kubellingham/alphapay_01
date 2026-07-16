import Link from "next/link";
import { getUserAndProfile } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";

export async function Nav() {
  const { user, profile } = await getUserAndProfile();
  const isStaff = profile?.role === "staff" || profile?.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-sm font-black text-background">
            A
          </span>
          AlphaPay
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto whitespace-nowrap text-sm">
          <Link
            href="/"
            className="rounded-lg px-3 py-1.5 text-muted hover:bg-surface hover:text-foreground"
          >
            Convert
          </Link>
          {user && (
            <Link
              href="/orders"
              className="rounded-lg px-3 py-1.5 text-muted hover:bg-surface hover:text-foreground"
            >
              My orders
            </Link>
          )}
          {isStaff && (
            <Link
              href="/admin"
              className="rounded-lg px-3 py-1.5 text-warning hover:bg-surface"
            >
              Staff
            </Link>
          )}
          {user ? (
            <div className="ml-2 flex items-center gap-2">
              <Link
                href="/profile"
                className="hidden rounded-lg px-3 py-1.5 text-muted hover:bg-surface hover:text-foreground sm:block"
              >
                {profile?.full_name?.split(" ")[0] ?? "Profile"}
              </Link>
              <form action={signOut}>
                <button className="rounded-lg border border-edge px-3 py-1.5 text-muted hover:text-foreground">
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-2 rounded-lg bg-accent px-3 py-1.5 font-semibold text-background hover:bg-accent-strong"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
