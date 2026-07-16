-- AlphaPay 0004: receipt re-upload, profit snapshot, staff order deletion.

-- ---------------------------------------------------------------------------
-- Snapshot the margin on each order so profit stats stay exact even after
-- the admin changes the margin later.
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists margin_used numeric(5, 2);

-- ---------------------------------------------------------------------------
-- Students may now also fix their receipt: replace it while under review,
-- or upload a corrected one after a rejection (order goes back to review).
-- ---------------------------------------------------------------------------
drop policy if exists "Users can update own open orders" on public.orders;
create policy "Users can update own open orders"
  on public.orders for update
  using (
    user_id = auth.uid()
    and status in ('awaiting_payment', 'under_review', 'rejected')
  )
  with check (user_id = auth.uid());

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
     or new.rate_used   is distinct from old.rate_used
     or new.margin_used is distinct from old.margin_used
     or new.created_at  is distinct from old.created_at then
    raise exception 'Order terms cannot be changed';
  end if;

  if not acting_staff then
    if new.staff_note is distinct from old.staff_note
       or new.handled_by is distinct from old.handled_by then
      raise exception 'Only staff can set staff fields';
    end if;
    if old.status = 'awaiting_payment' and new.status = 'under_review' then
      if new.receipt_path is null then
        raise exception 'A payment receipt is required for review';
      end if;
    elsif old.status = 'awaiting_payment' and new.status = 'cancelled' then
      null;
    elsif old.status = 'awaiting_payment' and new.status = old.status then
      null; -- editing before submitting
    elsif old.status = 'under_review' and new.status = 'under_review' then
      -- replacing the receipt while waiting for review
      if new.receipt_path is null then
        raise exception 'A payment receipt is required for review';
      end if;
    elsif old.status = 'rejected' and new.status = 'under_review' then
      -- re-submitting a corrected receipt after a rejection
      if new.receipt_path is null then
        raise exception 'A payment receipt is required for review';
      end if;
    else
      raise exception 'Invalid status change: % -> %', old.status, new.status;
    end if;
  else
    if not (
      new.status = old.status
      or (old.status = 'awaiting_payment' and new.status in ('under_review', 'rejected', 'cancelled'))
      or (old.status = 'under_review'     and new.status in ('confirmed', 'rejected'))
      or (old.status = 'confirmed'        and new.status in ('delivered'))
    ) then
      raise exception 'Invalid status change: % -> %', old.status, new.status;
    end if;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Staff can delete orders (events cascade via FK) and their receipt files.
-- ---------------------------------------------------------------------------
create policy "Staff can delete orders"
  on public.orders for delete
  using (public.is_staff());

create policy "Staff can delete receipts"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'receipts' and public.is_staff());
