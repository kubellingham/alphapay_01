import { RoleSelect } from "@/components/role-select";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { type Profile } from "@/lib/types";
import { LocalTime } from "@/components/local-time";

export const metadata = { title: "Users" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const { user } = await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const profiles = (data ?? []) as Profile[];

  return (
    <div className="overflow-x-auto rounded-2xl border border-edge">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Joined</th>
            <th className="px-4 py-3">Role</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => (
            <tr key={profile.id} className="border-t border-edge">
              <td className="px-4 py-3 font-semibold">{profile.full_name ?? "—"}</td>
              <td className="px-4 py-3 text-muted">{profile.email ?? "—"}</td>
              <td className="px-4 py-3 text-muted">{profile.phone ?? "—"}</td>
              <td className="px-4 py-3 text-muted"><LocalTime iso={profile.created_at} /></td>
              <td className="px-4 py-3">
                <RoleSelect
                  userId={profile.id}
                  role={profile.role}
                  isSelf={profile.id === user.id}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
