"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus, Role } from "@/lib/types";

export interface AdminActionState {
  error?: string;
  saved?: boolean;
}

function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

async function requireStaffUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || (profile.role !== "staff" && profile.role !== "admin")) {
    redirect("/");
  }
  return { supabase, user, role: profile.role as Role };
}

const STAFF_TRANSITIONS: Record<string, { to: OrderStatus; requiresNote?: boolean }> = {
  confirm: { to: "confirmed" },
  deliver: { to: "delivered" },
  reject: { to: "rejected", requiresNote: true },
};

export async function updateOrderStatus(
  _prev: AdminActionState,
  form: FormData,
): Promise<AdminActionState> {
  const { supabase, user } = await requireStaffUser();

  const orderId = str(form, "order_id");
  const action = str(form, "action");
  const note = str(form, "note");

  const transition = STAFF_TRANSITIONS[action];
  if (!transition) return { error: "Unknown action." };
  if (transition.requiresNote && !note) {
    return { error: "Add a note explaining the rejection — the student will see it." };
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status: transition.to,
      handled_by: user.id,
      ...(note ? { staff_note: note } : {}),
    })
    .eq("id", orderId);

  if (error) {
    return { error: `Could not update the order: ${error.message}` };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return { saved: true };
}

export async function updateMargin(
  _prev: AdminActionState,
  form: FormData,
): Promise<AdminActionState> {
  const { supabase, role } = await requireStaffUser();
  if (role !== "admin") return { error: "Only admins can change margins." };

  const pair = str(form, "pair");
  const margin = Number(str(form, "margin_percent"));
  if (!["TZS_TO_INR", "INR_TO_TZS"].includes(pair)) return { error: "Unknown pair." };
  if (!Number.isFinite(margin) || margin < 0 || margin > 20) {
    return { error: "Margin must be between 0 and 20 percent." };
  }

  const { error } = await supabase
    .from("rates")
    .update({ margin_percent: margin })
    .eq("pair", pair);
  if (error) return { error: `Could not update the margin: ${error.message}` };

  revalidatePath("/admin/rates");
  revalidatePath("/");
  return { saved: true };
}

export async function saveCollectionAccount(
  _prev: AdminActionState,
  form: FormData,
): Promise<AdminActionState> {
  const { supabase, role } = await requireStaffUser();
  if (role !== "admin") return { error: "Only admins can manage accounts." };

  const currency = str(form, "currency");
  const type = str(form, "type");
  const accountName = str(form, "account_name");
  if (!["TZS", "INR"].includes(currency)) return { error: "Choose a currency." };
  if (!["bank", "mobile_money"].includes(type)) return { error: "Choose a type." };
  if (!accountName) return { error: "Enter the account holder name." };

  const details: Record<string, string> = {};
  if (type === "bank") {
    const bank = str(form, "bank_name");
    const number = str(form, "account_number");
    const extra = str(form, "extra");
    if (!bank || !number) return { error: "Enter the bank name and account number." };
    details.bank = bank;
    details.account_number = number;
    if (extra) details[currency === "INR" ? "ifsc_or_upi" : "branch_or_swift"] = extra;
  } else {
    const provider = str(form, "provider");
    const number = str(form, "mobile_number");
    if (!provider || !number) return { error: "Enter the provider and mobile number." };
    details.provider = provider;
    details.number = number;
  }

  const { error } = await supabase.from("collection_accounts").insert({
    currency,
    type,
    account_name: accountName,
    account_details: details,
  });
  if (error) return { error: `Could not save the account: ${error.message}` };

  revalidatePath("/admin/accounts");
  return { saved: true };
}

export async function toggleCollectionAccount(form: FormData): Promise<void> {
  const { supabase, role } = await requireStaffUser();
  if (role !== "admin") return;

  const id = str(form, "account_id");
  const activate = str(form, "activate") === "true";
  await supabase
    .from("collection_accounts")
    .update({ is_active: activate })
    .eq("id", id);
  revalidatePath("/admin/accounts");
}

export async function setUserRole(
  _prev: AdminActionState,
  form: FormData,
): Promise<AdminActionState> {
  const { supabase, user, role } = await requireStaffUser();
  if (role !== "admin") return { error: "Only admins can change roles." };

  const targetId = str(form, "user_id");
  const newRole = str(form, "role") as Role;
  if (!["student", "staff", "admin"].includes(newRole)) {
    return { error: "Unknown role." };
  }
  if (targetId === user.id) {
    return { error: "You cannot change your own role." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", targetId);
  if (error) return { error: `Could not change the role: ${error.message}` };

  revalidatePath("/admin/users");
  return { saved: true };
}
