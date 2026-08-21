begin;

alter table public.entitlements
  drop constraint if exists entitlements_plan_check;

alter table public.entitlements
  add constraint entitlements_plan_check
  check (plan = any (array['free'::text, 'pro'::text, 'unlimited'::text, 'dev'::text]));

commit;
