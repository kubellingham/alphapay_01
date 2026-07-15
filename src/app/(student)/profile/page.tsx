import { ProfileForm } from "@/components/profile-form";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { user, profile } = await requireUser();

  return (
    <div>
      <h1 className="text-2xl font-bold">Your profile</h1>
      <p className="mt-1 text-sm text-muted">
        Signed in as <span className="font-semibold text-foreground">{user.email}</span>
        {profile?.role !== "student" && (
          <span className="ml-2 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
            {profile?.role}
          </span>
        )}
      </p>
      <div className="mt-6">
        <ProfileForm
          fullName={profile?.full_name ?? ""}
          phone={profile?.phone ?? ""}
        />
      </div>
    </div>
  );
}
