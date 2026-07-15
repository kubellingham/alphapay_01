# AlphaPay

A mobile-first PWA that moves money between **Tanzanian shillings (TZS)** and
**Indian rupees (INR)** for Tanzanian students in India — a friendly
alternative to Western Union-style remittance.

**How it works**

1. Anyone can open the app and use the converter — live market rates refresh
   hourly, with AlphaPay's margin applied.
2. A student signs in with Google, enters how much they want to receive, and
   chooses delivery: **cash to their address** or **a transfer to their bank
   account**. The quoted rate is locked into the order.
3. The app shows AlphaPay's collection account (M-Pesa / bank / UPI) for the
   sender to pay, and the student uploads the payment receipt.
4. AlphaPay staff review the receipt in the dashboard, **confirm** the payment,
   and **mark it delivered**. The student tracks every step on a status
   timeline.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript) + Tailwind CSS
- [Supabase](https://supabase.com) — Postgres, Google auth, receipt storage,
  Row Level Security
- [Serwist](https://serwist.pages.dev) — service worker; the app is
  installable on phones
- FX feed: [open.er-api.com](https://www.exchangerate-api.com/docs/free)
  (no API key), TZS/INR crosses computed via USD

## Local setup

### 1. Supabase project

1. Create a free project at [database.new](https://database.new).
2. In the SQL editor, run the files in `supabase/migrations/` **in order**
   (`0001_profiles.sql`, `0002_rates.sql`, `0003_orders.sql`), then optionally
   `supabase/seed.sql` for sample collection accounts.
   (Or use the Supabase CLI: `supabase db push`.)

### 2. Google sign-in

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   create an OAuth client ID (web application).
2. Add the redirect URL shown in **Supabase → Authentication → Providers →
   Google** (it looks like `https://YOUR-PROJECT.supabase.co/auth/v1/callback`).
3. Paste the client ID and secret into that same Supabase screen and enable
   the provider.
4. Under **Authentication → URL Configuration**, set your site URL and add
   `http://localhost:3000/**` to the redirect allow-list for development.

### 3. Environment & run

```bash
cp .env.example .env.local   # fill in the values from Supabase → Settings → API
npm install
npm run dev
```

Open http://localhost:3000. Sign in once, then make yourself admin:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

The staff dashboard appears at `/admin` (Orders · Rates · Accounts · Users).

### 4. Refresh market rates

Rates stay fresh three ways, all needing `SUPABASE_SERVICE_ROLE_KEY`:

- **On traffic (main path):** any page view that finds rates older than an
  hour serves the stored rate and refreshes in the background.
- **Daily cron backstop:** the Vercel cron in `vercel.json` calls
  `GET /api/cron/refresh-rates` (protected by `CRON_SECRET`) even when the
  site has no visitors.
- **Manually:** the "Refresh rates now" button in **Staff → Rates**.

Margins are edited in **Staff → Rates**; changing a rate never affects
already-placed orders. The free FX feed publishes roughly daily — for true
intraday rates, swap the URL in `fetchMarketRates()` (`src/lib/rates.ts`)
for a keyed provider.

## Deploying (Vercel)

1. Import the repo into Vercel.
2. Set the env vars from `.env.example` in the project settings.
3. The `vercel.json` cron schedule is picked up automatically.
4. Add your production URL to Supabase's auth redirect allow-list.

## Roles & security

| Role | Can do |
|---|---|
| `student` (default) | Convert, create orders, upload receipts, track own orders |
| `staff` | Order queue, view receipts, confirm / reject / deliver |
| `admin` | Staff + margins, collection accounts, user roles |

Enforced with Postgres RLS: students only ever see their own orders, events,
and receipt files; order financial terms are immutable after creation; status
changes are validated by a database trigger; every transition is logged to
`order_events`.

## Project layout

```
src/app/            pages: converter (public), order wizard, my orders,
                    login, /admin dashboard, rate-refresh cron
src/components/     converter, order wizard, timelines, admin forms
src/lib/            supabase clients, auth guards, server actions, rates
supabase/           SQL migrations + seed
```

Money transfer is self-contained, so future modules (room bookings, movie
offers, …) can be added as sibling routes without touching it.
