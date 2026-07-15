-- AlphaPay: profiles, roles, and auth plumbing.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text not null default 'student' check (role in ('student', 'staff', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Role helpers. SECURITY DEFINER so RLS policies can call them without
-- recursing into the profiles policies themselves.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('staff', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy "Users can view own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Staff can view all profiles"
  on public.profiles for select
  using (public.is_staff());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin())
  with check (true);

-- Only admins may change roles (superuser/service-role contexts have no
-- auth.uid() and are allowed, e.g. seeds and the SQL editor).
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only admins can change roles';
  end if;
  return new;
end;
$$;

create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- Auto-create a profile row on first sign-in.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
