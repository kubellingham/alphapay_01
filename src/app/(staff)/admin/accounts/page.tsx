import { AccountForm } from "@/components/account-form";
import { PendingButton } from "@/components/pending-button";
import { toggleCollectionAccount } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { CollectionAccount } from "@/lib/types";

export const metadata = { title: "Collection accounts" };
export const dynamic = "force-dynamic";

export default async function AdminAccountsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("collection_accounts")
    .select("*")
    .order("currency")
    .order("created_at");
  const accounts = (data ?? []) as CollectionAccount[];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section>
        <h2 className="font-bold">Where senders pay AlphaPay</h2>
        <p className="mt-1 text-sm text-muted">
          Active accounts are shown to customers on the payment step, matched to
          the currency the sender pays.
        </p>
        {accounts.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-edge bg-surface p-6 text-center text-sm text-muted">
            No accounts yet — add the first one on the right.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {accounts.map((account) => (
              <li
                key={account.id}
                className={`rounded-2xl border p-4 text-sm ${
                  account.is_active
                    ? "border-edge bg-surface"
                    : "border-edge/50 bg-surface/50 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">
                    {account.type === "mobile_money" ? "📱" : "🏦"}{" "}
                    {account.account_name}
                    <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold">
                      {account.currency}
                    </span>
                  </p>
                  <form action={toggleCollectionAccount}>
                    <input type="hidden" name="account_id" value={account.id} />
                    <input
                      type="hidden"
                      name="activate"
                      value={account.is_active ? "false" : "true"}
                    />
                    <PendingButton
                      pendingText="…"
                      className={`rounded-lg border px-3 py-1 text-xs font-semibold ${
                        account.is_active
                          ? "border-danger/40 text-danger hover:bg-danger/10"
                          : "border-accent/40 text-accent hover:bg-accent/10"
                      }`}
                    >
                      {account.is_active ? "Deactivate" : "Activate"}
                    </PendingButton>
                  </form>
                </div>
                <dl className="mt-2 space-y-0.5">
                  {Object.entries(account.account_details).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <dt className="capitalize text-muted">{k.replaceAll("_", " ")}</dt>
                      <dd className="font-mono">{v}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-edge bg-surface p-5">
        <h2 className="font-bold">Add account</h2>
        <div className="mt-4">
          <AccountForm />
        </div>
      </section>
    </div>
  );
}
