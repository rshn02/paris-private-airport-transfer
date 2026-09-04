-- Run this in Supabase Dashboard > SQL Editor before deploying the admin endpoint.
-- This preserves historical bookings and adds fields used only by authenticated admins.

alter table public.bookings
  add column if not exists calculated_price numeric(10, 2),
  add column if not exists price_override boolean not null default false,
  add column if not exists override_reason text,
  add column if not exists admin_user_id uuid references auth.users(id),
  add column if not exists internal_note text,
  add column if not exists internal_reference text;

create table if not exists public.booking_admin_audit_logs (
  id bigint generated always as identity primary key,
  booking_number text not null,
  calculated_price numeric(10, 2) not null,
  previous_price numeric(10, 2),
  final_price numeric(10, 2) not null,
  discount_amount numeric(10, 2) not null default 0,
  override_reason text,
  admin_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.booking_admin_audit_logs enable row level security;

-- No browser role receives a policy. The Express backend uses its service-role key.
revoke all on table public.booking_admin_audit_logs from anon, authenticated;
