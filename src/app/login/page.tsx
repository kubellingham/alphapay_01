import { redirect } from "next/navigation";
import { LogoMark } from "@/components/logo";
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
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col px-6 py-8">
      <div className="flex items-center gap-2.5 font-extrabold text-lg tracking-tight">
        <LogoMark />
        AlphaPay
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight">
          Welcome back.
        </h1>
        <p className="mt-2.5 text-[15px] leading-relaxed text-muted">
          Sign in to place a transfer and track your orders. We use your Google
          account so there&apos;s no extra password to remember.
        </p>

        {error && (
          <p className="mt-5 rounded-xl border border-danger/40 bg-danger-soft px-4 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}

        <form action={signIn} className="mt-6">
          <PendingButton
            pendingText="Opening Google…"
            className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[14px] border border-edge-strong bg-surface text-base font-bold hover:border-foreground"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.4c-.24 1.4-1.7 4.1-5.4 4.1-3.25 0-5.9-2.7-5.9-6s2.65-6 5.9-6c1.85 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.6 14.6 2.6 12 2.6 6.9 2.6 2.8 6.7 2.8 12S6.9 21.4 12 21.4c5.9 0 9.8-4.15 9.8-10 0-.67-.07-1.18-.16-1.7H12z"
              />
            </svg>
            Continue with Google
          </PendingButton>
        </form>

        <p className="mt-5 flex items-center gap-2 text-[12.5px] text-faint">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.7" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.7" />
          </svg>
          Secured with Google sign-in — your account is created on first sign-in.
        </p>
      </div>
    </div>
  );
}
