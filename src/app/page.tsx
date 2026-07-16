import { AutoRefresh } from "@/components/auto-refresh";
import { Converter } from "@/components/converter";
import { getRates } from "@/lib/rates";

export const dynamic = "force-dynamic";

const TRUST_CHIPS = [
  {
    label: (
      <>
        Every payment
        <br />
        verified by staff
      </>
    ),
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z"
          stroke="var(--primary)"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M9 12l2 2 4-4"
          stroke="var(--primary)"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: (
      <>
        Cash or bank
        <br />
        delivery
      </>
    ),
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="var(--primary)" strokeWidth="1.7" />
        <path
          d="M12 7v5l3 2"
          stroke="var(--primary)"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: (
      <>
        Rate locked
        <br />
        at order time
      </>
    ),
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 12h16" stroke="var(--primary)" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M4 7h16M4 17h10" stroke="var(--primary)" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default async function Home() {
  const rates = await getRates();

  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Keeps the displayed rate live while the page is open */}
      <AutoRefresh intervalMs={30000} />
      <section className="grid items-center gap-10 py-10 md:grid-cols-2 md:py-16">
        <div>
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight md:text-5xl">
            Send money home, or to school — safely.
          </h1>
          <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-muted">
            Trusted transfers between Tanzanian shillings and Indian rupees.
            Real people check every payment, and your money arrives as cash or
            straight to a bank account.
          </p>
        </div>
        <Converter rates={rates} />
      </section>

      <section className="grid grid-cols-3 gap-2.5 pb-16 sm:gap-4">
        {TRUST_CHIPS.map((chip, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1.5 rounded-[14px] border border-edge bg-surface px-2 py-3.5 text-center"
          >
            {chip.icon}
            <span className="text-[11.5px] font-semibold leading-snug text-muted">
              {chip.label}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
