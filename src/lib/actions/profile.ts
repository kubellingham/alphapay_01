"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ProfileActionState {
  error?: string;
  saved?: boolean;
}

export async function updateProfile(
  _prev: ProfileActionState,
  form: FormData,
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fullName = String(form.get("full_name") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();

  if (!fullName) return { error: "Enter your full name." };
  if (phone && !/^\+?[0-9\s-]{7,17}$/.test(phone)) {
    return { error: "Enter a valid phone number (include the country code, e.g. +91…)." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone: phone || null })
    .eq("id", user.id);

  if (error) return { error: "Could not save your profile. Please try again." };

  revalidatePath("/profile");
  return { saved: true };
}
