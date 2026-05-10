
-- Payment settings (admin-managed)
create table public.payment_settings (
  id uuid primary key default gen_random_uuid(),
  card_number text not null default '8600 0000 0000 0000',
  card_holder text not null default 'FluentUp',
  phone text not null default '+998 90 000 00 00',
  payme_link text,
  click_link text,
  instructions text,
  updated_at timestamptz not null default now()
);
alter table public.payment_settings enable row level security;
create policy "anyone reads payment settings" on public.payment_settings for select using (true);
create policy "admins manage payment settings" on public.payment_settings for all to authenticated using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));
insert into public.payment_settings (id) values (gen_random_uuid());

-- Subscription requests
create type public.payment_status as enum ('pending','approved','rejected');

create table public.subscription_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan public.subscription_plan not null,
  period text not null default 'monthly',
  amount_uzs integer not null default 0,
  full_name text not null,
  phone text not null,
  method text not null default 'payme',
  note text,
  screenshot_url text,
  status public.payment_status not null default 'pending',
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscription_requests enable row level security;

create policy "users see own requests" on public.subscription_requests for select to authenticated
  using (auth.uid() = user_id or has_role(auth.uid(),'admin'));
create policy "users insert own requests" on public.subscription_requests for insert to authenticated
  with check (auth.uid() = user_id);
create policy "admins update requests" on public.subscription_requests for update to authenticated
  using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

create trigger trg_subreq_updated before update on public.subscription_requests
for each row execute function public.update_updated_at_column();

-- Storage bucket for screenshots (public read so admin & user can see)
insert into storage.buckets (id, name, public) values ('payment_screenshots','payment_screenshots', true)
on conflict (id) do nothing;

create policy "auth users upload payment screenshots"
on storage.objects for insert to authenticated
with check (bucket_id = 'payment_screenshots' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "anyone reads payment screenshots"
on storage.objects for select using (bucket_id = 'payment_screenshots');

create policy "users delete own payment screenshots"
on storage.objects for delete to authenticated
using (bucket_id='payment_screenshots' and auth.uid()::text = (storage.foldername(name))[1]);

-- RPC: approve a request -> activate plan for 30/365 days
create or replace function public.approve_subscription_request(_request_id uuid, _admin_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _r public.subscription_requests%rowtype;
  _expires timestamptz;
begin
  if not has_role(auth.uid(),'admin') then
    raise exception 'not authorized';
  end if;
  select * into _r from public.subscription_requests where id = _request_id for update;
  if not found then raise exception 'request not found'; end if;

  if _r.period = 'yearly' then
    _expires := now() + interval '365 days';
  else
    _expires := now() + interval '30 days';
  end if;

  update public.profiles set plan = _r.plan, plan_expires_at = _expires where id = _r.user_id;
  update public.subscription_requests
    set status = 'approved', admin_note = _admin_note, reviewed_by = auth.uid(), reviewed_at = now()
    where id = _request_id;
end;
$$;

create or replace function public.reject_subscription_request(_request_id uuid, _admin_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_role(auth.uid(),'admin') then
    raise exception 'not authorized';
  end if;
  update public.subscription_requests
    set status = 'rejected', admin_note = _admin_note, reviewed_by = auth.uid(), reviewed_at = now()
    where id = _request_id;
end;
$$;
