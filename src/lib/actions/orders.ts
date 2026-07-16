"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DIRECTION_INFO, type DeliveryMethod, type Direction } from "@/lib/types";

export interface OrderActionState {
  error?: string;
}

const MAX_RECEIPT_BYTES = 8 * 1024 * 1024;
const RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function createOrder(
  _prev: OrderActionState,
  form: FormData,
): Promise<OrderActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/order/new");

  const direction = str(form, "direction") as Direction;
  if (!DIRECTION_INFO[direction]) return { error: "Choose a transfer direction." };
  const info = DIRECTION_INFO[direction];

  const receiveAmount = Number(str(form, "receive_amount").replace(/,/g, ""));
  if (!Number.isFinite(receiveAmount) || receiveAmount <= 0) {
    return { error: "Enter a valid amount to receive." };
  }
  if (receiveAmount > 10_000_000) {
    return { error: "That amount is too large for an online order — contact us directly." };
  }

  const deliveryMethod = str(form, "delivery_method") as DeliveryMethod;
  let deliveryDetails: Record<string, string>;
  if (deliveryMethod === "cash") {
    deliveryDetails = {
      recipient_name: str(form, "recipient_name"),
      address: str(form, "address"),
      city: str(form, "city"),
      landmark: str(form, "landmark"),
    };
    if (!deliveryDetails.recipient_name || !deliveryDetails.address || !deliveryDetails.city) {
      return { error: "Fill in the recipient name, address, and city for cash delivery." };
    }
  } else if (deliveryMethod === "bank") {
    deliveryDetails = {
      account_name: str(form, "account_name"),
      account_number: str(form, "account_number"),
      bank_name: str(form, "bank_name"),
      branch_or_ifsc: str(form, "branch_or_ifsc"),
    };
    if (!deliveryDetails.account_name || !deliveryDetails.account_number || !deliveryDetails.bank_name) {
      return { error: "Fill in the account name, account number, and bank name." };
    }
  } else {
    return { error: "Choose how you want to receive the money." };
  }

  // Phone is required so staff can coordinate delivery.
  const phone = str(form, "phone");
  if (phone) {
    const { error } = await supabase
      .from("profiles")
      .update({ phone })
      .eq("id", user.id);
    if (error) return { error: "Could not save your phone number." };
  } else {
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", user.id)
      .single();
    if (!profile?.phone) {
      return { error: "Add a phone number so our team can reach you about delivery." };
    }
  }

  // Quote server-side from the current stored rate — the client's numbers are
  // display-only. The quoted rate is locked into the order.
  const { data: rate, error: rateError } = await supabase
    .from("rates")
    .select("effective_rate, margin_percent")
    .eq("pair", direction)
    .single();
  if (rateError || !rate) {
    return { error: "Rates are unavailable right now. Please try again shortly." };
  }
  const effectiveRate = Number(rate.effective_rate);
  const sendAmount = receiveAmount / effectiveRate;

  const orderRow = {
    user_id: user.id,
    direction,
    send_currency: info.send,
    send_amount: Math.round(sendAmount * 100) / 100,
    receive_currency: info.receive,
    receive_amount: Math.round(receiveAmount * 100) / 100,
    rate_used: effectiveRate,
    margin_used: Number(rate.margin_percent),
    delivery_method: deliveryMethod,
    delivery_details: deliveryDetails,
  };

  let { data: order, error } = await supabase
    .from("orders")
    .insert(orderRow)
    .select("id")
    .single();

  // Graceful fallback while the 0004 migration (margin_used column) hasn't
  // been applied yet — never block a customer order on a stats column.
  if (error && error.message.includes("margin_used")) {
    const legacyRow: Partial<typeof orderRow> = { ...orderRow };
    delete legacyRow.margin_used;
    ({ data: order, error } = await supabase
      .from("orders")
      .insert(legacyRow)
      .select("id")
      .single());
  }

  if (error || !order) {
    return { error: "Could not create the order. Please try again." };
  }

  redirect(`/orders/${order.id}?created=1`);
}

export async function uploadReceipt(
  _prev: OrderActionState,
  form: FormData,
): Promise<OrderActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const orderId = str(form, "order_id");
  const file = form.get("receipt");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a receipt photo or PDF first." };
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    return { error: "The file is too large (max 8 MB)." };
  }
  if (!RECEIPT_TYPES.includes(file.type)) {
    return { error: "Upload a JPG, PNG, WebP, or PDF." };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, user_id")
    .eq("id", orderId)
    .single();
  if (!order || order.user_id !== user.id) return { error: "Order not found." };
  // Receipts can be submitted while awaiting payment, replaced while under
  // review, and re-submitted after a rejection (order returns to review).
  if (!["awaiting_payment", "under_review", "rejected"].includes(order.status)) {
    return { error: "This order is no longer waiting for a receipt." };
  }

  const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1];
  const path = `${user.id}/${orderId}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    return { error: "Upload failed. Please try again." };
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ receipt_path: path, status: "under_review" })
    .eq("id", orderId);
  if (updateError) {
    return { error: "Could not attach the receipt to your order." };
  }

  revalidatePath(`/orders/${orderId}`);
  return {};
}

export async function cancelOrder(form: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const orderId = str(form, "order_id");
  await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .eq("user_id", user.id)
    .eq("status", "awaiting_payment");

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
}
