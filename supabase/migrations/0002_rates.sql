-- AlphaPay: exchange rates. One row per direction; the pair is named by
-- SEND currency -> RECEIVE currency. market_rate is units of the receive
-- currency per 1 unit of the send currency. The effective (customer) rate
-- applies the firm's margin.

create table public.rates (
  pair text primary key check (pair in ('TZS_TO_INR', 'INR_TO_TZS')),
  market_rate numeric(18, 8) not null check (market_rate > 0),
  margin_percent numeric(5, 2) not null default 2.00 check (margin_percent >= 0 and margin_percent < 100),
  effective_rate numeric(18, 8) generated always as (market_rate * (1 - margin_percent / 100)) stored,
  fetched_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rates enable row level security;

-- Rates are public information (the converter works logged-out).
create policy "Anyone can read rates"
  on public.rates for select
  using (true);

-- Admins tune the margin from the dashboard; the market rate itself is
-- written by the cron job using the service-role key (bypasses RLS).
create policy "Admins can update rates"
  on public.rates for update
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.set_rates_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_rates_updated_at
  before update on public.rates
  for each row execute function public.set_rates_updated_at();

-- Seed both directions with sensible starting values so the app renders
-- before the first cron run (the cron overwrites market_rate/fetched_at).
insert into public.rates (pair, market_rate, margin_percent, fetched_at)
values
  ('TZS_TO_INR', 0.0340, 2.00, now()),
  ('INR_TO_TZS', 29.40, 2.00, now());
