-- OPTIONAL MIGRATION — DO NOT RUN AUTOMATICALLY.
--
-- Purpose: associate non-personal first/last-touch marketing attribution with
-- each booking while keeping the schema maintainable in a single JSONB field.
--
-- Safe activation order:
--   1. Run this migration manually in Supabase Dashboard > SQL Editor.
--   2. Verify the new column exists on public.bookings.
--   3. Set STORE_MARKETING_ATTRIBUTION=true on the backend and redeploy it.
--
-- Until step 3, the backend deliberately ignores the optional attribution
-- payload, so deploying frontend/backend code before this migration cannot
-- break booking creation.

alter table public.bookings
  add column if not exists marketing_attribution jsonb;

comment on column public.bookings.marketing_attribution is
  'Non-personal marketing first/last-touch attribution supplied by the PPAT frontend.';
