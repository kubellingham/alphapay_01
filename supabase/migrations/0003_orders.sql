-- AlphaPay: collection accounts, orders, order events, and the receipts
-- storage bucket.

-- ---------------------------------------------------------------------------
-- Collection accounts: where senders pay AlphaPay (M-Pesa / bank / UPI).
-- ---------------------------------------------------------------------------
create table public.collection_accounts (
  id uuid primary key default gen_random_uuid(),
  currency text not null check (currency in ('TZS', 'INR')),
  type text not null check (type in ('bank', 'mobile_money')),
  account_name text not null,
  account_details jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.collection_accounts enable row level security;

create policy "Authenticated users can view active accounts"
  on public.collection_accounts for select
  to authenticated
  using (is_active or public.is_staff());

create policy "Admins can manage accounts"
  on public.collection_accounts for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Orders.
-- ---------------------------------------------------------------------------
create sequence public.order_reference_seq;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique
    default 'AP-' || to_char(now(), 'YYYY') || '-' ||
            lpad(nextval('public.order_reference_seq')::text, 5, '0'),
  user_id uuid not null references public.profiles (id),
  direction text not null check (direction in ('TZS_TO_INR', 'INR_TO_TZS')),
  send_currency text not null check (send_currency in ('TZS', 'INR')),
  send_amount numeric(18, 2) not null check (send_amount > 0),
  receive_currency text not null check (receive_currency in ('TZS', 'INR')),
  receive_amount numeric(18, 2) not null check (receive_amount > 0),
  -- The rate quoted at creation. Locked: later rate refreshes never touch it.
  rate_used numeric(18, 8) not null check (rate_used > 0),
  delivery_method text not null check (delivery_method in ('cash', 'bank')),
  delivery_details jsonb not null default '{}'::jsonb,
  receipt_path text,
  status text not null default 'awaiting_payment' check (status in
    ('awaiting_payment', 'under_review', 'confirmed', 'delivered', 'rejected', 'cancelled')),
  staff_note text,
  handled_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_id_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);

alter table public.orders enable row level security;

create policy "Users can view own orders"
  on public.orders for select
  using (user_id = auth.uid());

create policy "Staff can view all orders"
  on public.orders for select
  using (public.is_staff());

create policy "Users can create own orders"
  on public.orders for insert
  with check (user_id = auth.uid() and status = 'awaiting_payment');

create policy "Users can update own open orders"
  on public.orders for update
  using (user_id = auth.uid() and status = 'awaiting_payment')
  with check (user_id = auth.uid());

create policy "Staff can update orders"
  on public.orders for update
  using (public.is_staff())
  with check (public.is_staff());

-- Validate every update: students may only attach a receipt or cancel, and
-- nobody may rewrite the financial terms of an existing order. Staff moves
-- follow the status flow:
--   awaiting_payment -> under_review -> confirmed -> delivered
--   with rejected/cancelled as side exits.
create or replace function public.validate_order_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_staff boolean := public.is_staff() or auth.uid() is null;
begin
  -- Financial terms and ownership are immutable for everyone.
  if new.user_id       is distinct from old.user_id
     or new.reference  is distinct from old.reference
     or new.direction  is distinct from old.direction
     or new.send_currency    is distinct from old.send_currency
     or new.send_amount      is distinct from old.send_amount
     or new.receive_currency is distinct from old.receive_currency
     or new.receive_amount   is distinct from old.receive_amount
     or new.rate_used  is distinct from old.rate_used
     or new.created_at is distinct from old.created_at then
    raise exception 'Order terms cannot be changed';
  end if;

  if not acting_staff then
    if new.staff_note is distinct from old.staff_note
       or new.handled_by is distinct from old.handled_by then
      raise exception 'Only staff can set staff fields';
    end if;
    -- Students: upload receipt (-> under_review) or cancel, only while
    -- awaiting payment.
    if old.status = 'awaiting_payment' and new.status = 'under_review' then
      if new.receipt_path is null then
        raise exception 'A payment receipt is required for review';
      end if;
    elsif old.status = 'awaiting_payment' and new.status = 'cancelled' then
      null;
    elsif new.status = old.status and old.status = 'awaiting_payment' then
      null; -- editing delivery details / receipt before submitting
    else
      raise exception 'Invalid status change: % -> %', old.status, new.status;
    end if;
  else
    if not (
      new.status = old.status
      or (old.status = 'awaiting_payment' and new.status in ('under_review', 'rejected', 'cancelled'))
      or (old.status = 'under_review'     and new.status in ('confirmed', 'rejected'))
      or (old.status = 'confirmed'        and new.status in ('delivered', 'rejected'))
    ) then
      raise exception 'Invalid status change: % -> %', old.status, new.status;
    end if;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

create trigger validate_order_update
  before update on public.orders
  for each row execute function public.validate_order_update();

-- ---------------------------------------------------------------------------
-- Order events: append-only audit trail, written by triggers.
-- ---------------------------------------------------------------------------
create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_id uuid,
  note text,
  created_at timestamptz not null default now()
);

create index order_events_order_id_idx on public.order_events (order_id, created_at);

alter table public.order_events enable row level security;

create policy "Users can view events of own orders"
  on public.order_events for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

create policy "Staff can view all events"
  on public.order_events for select
  using (public.is_staff());

create or replace function public.log_order_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_events (order_id, from_status, to_status, actor_id)
    values (new.id, null, new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.order_events (order_id, from_status, to_status, actor_id, note)
    values (
      new.id, old.status, new.status, auth.uid(),
      case when new.status in ('rejected') then new.staff_note end
    );
  end if;
  return new;
end;
$$;

create trigger log_order_event
  after insert or update on public.orders
  for each row execute function public.log_order_event();

-- ---------------------------------------------------------------------------
-- Receipts storage bucket (private). Files live at <user_id>/<order_id>.<ext>
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "Users can upload own receipts"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own receipts"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view own receipts"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Staff can view all receipts"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'receipts' and public.is_staff());
