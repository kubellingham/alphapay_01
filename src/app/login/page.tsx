import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import { signInWithGoogle } from "@/lib/actions/auth";
import { PendingButton } from "@/components/pending-button";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next = "/", error } = await searchParams;
  const { user } = await getUserAndProfile();
  if (user) redirect(next.startsWith("/") ? next : "/");

  const signIn = signInWithGoogle.bind(null, next);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-2xl font-black text-background">
        A
      </span>
      <h1 className="mt-6 text-2xl font-bold">Welcome to AlphaPay</h1>
      <p className="mt-2 text-sm text-muted">
        Sign in to place a money transfer order and track your deliveries.
      </p>

      {error && (
        <p className="mt-4 w-full rounded-lg border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <form action={signIn} className="mt-8 w-full">
        <PendingButton pendingText="Opening Google…" className="flex w-full items-center justify-center gap-3 rounded-xl border border-edge bg-surface px-4 py-3 font-semibold hover:bg-surface-2">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.8c2.4-2.1 3.7-5.1 3.7-8.5z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.8-5l-3.9 3C3.3 21.3 7.3 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-3.9-3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l3.9-3z"
            />
            <path
              fill="#EA4335"
              d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l3.9 3c.9-2.8 3.6-4.9 6.8-4.9z"
            />
          </svg>
          Continue with Google
        </PendingButton>
      </form>

      <p className="mt-6 text-xs text-muted">
        No account needed in advance — your AlphaPay account is created the
        first time you sign in.
      </p>
    </div>
  );
}
