import { Converter } from "@/components/converter";
import { getRates } from "@/lib/rates";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    title: "Get a quote",
    body: "Choose the direction and enter how much you want to receive — we instantly show what the sender pays at today's rate.",
  },
  {
    title: "Tell us where it goes",
    body: "Cash delivered to your address, or a transfer straight to your bank account.",
  },
  {
    title: "Pay & upload the receipt",
    body: "The sender pays AlphaPay's local account (M-Pesa, bank, or UPI) and you upload the payment receipt.",
  },
  {
    title: "We deliver",
    body: "Our team verifies the payment and delivers your money safely. Track every step in the app.",
  },
];

export default async function Home() {
  const rates = await getRates();

  return (
    <div className="mx-auto max-w-5xl px-4">
      <section className="grid items-center gap-10 py-10 md:grid-cols-2 md:py-16">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            Tanzania 🇹🇿 ⇄ 🇮🇳 India
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight md:text-5xl">
            Money from home, without the middleman markup.
          </h1>
          <p className="mt-4 text-muted">
            AlphaPay moves money between Tanzanian shillings and Indian rupees
            for students studying in India. Fair rates, receipts you can trust,
            and delivery as cash or straight to your bank.
          </p>
        </div>
        <Converter rates={rates} />
      </section>

      <section className="grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className="rounded-2xl border border-edge bg-surface p-5"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-accent/15 text-sm font-bold text-accent">
              {i + 1}
            </span>
            <h3 className="mt-3 font-bold">{step.title}</h3>
            <p className="mt-1 text-sm text-muted">{step.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
