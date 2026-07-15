import { OrderWizard } from "@/components/order-wizard";
import { requireUser } from "@/lib/auth";
import { getRates } from "@/lib/rates";
import type { Direction } from "@/lib/types";

export const metadata = { title: "New order" };
export const dynamic = "force-dynamic";

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ direction?: string; receive?: string }>;
}) {
  const params = await searchParams;
  const { profile } = await requireUser();
  const rates = await getRates();

  const direction: Direction =
    params.direction === "INR_TO_TZS" ? "INR_TO_TZS" : "TZS_TO_INR";
  const receive =
    params.receive && Number(params.receive) > 0
      ? String(Number(params.receive))
      : "";

  return (
    <div>
      <h1 className="text-2xl font-bold">New money transfer</h1>
      <p className="mt-1 text-sm text-muted">
        Three quick steps — then pay and upload your receipt.
      </p>
      <div className="mt-6">
        <OrderWizard
          rates={rates}
          initialDirection={direction}
          initialReceive={receive}
          needsPhone={!profile?.phone}
        />
      </div>
    </div>
  );
}
