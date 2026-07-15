export type Role = "student" | "staff" | "admin";

export type Currency = "TZS" | "INR";

/** Direction is named by what the recipient receives. */
export type Direction = "TZS_TO_INR" | "INR_TO_TZS";

export type OrderStatus =
  | "awaiting_payment"
  | "under_review"
  | "confirmed"
  | "delivered"
  | "rejected"
  | "cancelled";

export type DeliveryMethod = "cash" | "bank";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: Role;
  created_at: string;
}

export interface Rate {
  pair: Direction;
  market_rate: number;
  margin_percent: number;
  effective_rate: number;
  fetched_at: string;
  updated_at: string;
}

export interface CollectionAccount {
  id: string;
  currency: Currency;
  type: "bank" | "mobile_money";
  account_name: string;
  account_details: Record<string, string>;
  is_active: boolean;
  created_at: string;
}

export interface CashDeliveryDetails {
  recipient_name: string;
  address: string;
  city: string;
  landmark?: string;
}

export interface BankDeliveryDetails {
  account_name: string;
  account_number: string;
  bank_name: string;
  branch_or_ifsc?: string;
}

export interface Order {
  id: string;
  reference: string;
  user_id: string;
  direction: Direction;
  send_currency: Currency;
  send_amount: number;
  receive_currency: Currency;
  receive_amount: number;
  rate_used: number;
  delivery_method: DeliveryMethod;
  delivery_details: CashDeliveryDetails | BankDeliveryDetails;
  receipt_path: string | null;
  status: OrderStatus;
  staff_note: string | null;
  handled_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderEvent {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  actor_id: string | null;
  note: string | null;
  created_at: string;
}

export const DIRECTION_INFO: Record<
  Direction,
  { send: Currency; receive: Currency; label: string }
> = {
  TZS_TO_INR: { send: "TZS", receive: "INR", label: "Receive INR in India" },
  INR_TO_TZS: { send: "INR", receive: "TZS", label: "Receive TZS in Tanzania" },
};

export const STATUS_INFO: Record<
  OrderStatus,
  { label: string; description: string; tone: "pending" | "good" | "bad" }
> = {
  awaiting_payment: {
    label: "Awaiting payment",
    description: "Send the money to AlphaPay and upload your receipt.",
    tone: "pending",
  },
  under_review: {
    label: "Under review",
    description: "Our team is verifying your payment receipt.",
    tone: "pending",
  },
  confirmed: {
    label: "Confirmed",
    description: "Payment verified. Your money is on its way.",
    tone: "good",
  },
  delivered: {
    label: "Delivered",
    description: "The money has been delivered. Thank you for using AlphaPay!",
    tone: "good",
  },
  rejected: {
    label: "Rejected",
    description: "There was a problem with this order. See the note from our team.",
    tone: "bad",
  },
  cancelled: {
    label: "Cancelled",
    description: "This order was cancelled.",
    tone: "bad",
  },
};

export function formatMoney(amount: number, currency: Currency): string {
  const locale = currency === "INR" ? "en-IN" : "en-TZ";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "TZS" ? 0 : 2,
  }).format(amount);
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
