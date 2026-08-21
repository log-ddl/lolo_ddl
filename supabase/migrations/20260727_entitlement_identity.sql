begin;

alter table public.entitlements
  add column if not exists display_name text not null default '',
  add column if not exists email text not null default '';

update public.entitlements as entitlement
set
  display_name = profile.display_name,
  email = profile.email
from public.profiles as profile
where profile.user_id = entitlement.user_id
  and (
    entitlement.display_name is distinct from profile.display_name
    or entitlement.email is distinct from profile.email
  );

create or replace function public.sync_profile_identity_to_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.entitlements
  set
    display_name = new.display_name,
    email = new.email
  where user_id = new.user_id
    and (
      display_name is distinct from new.display_name
      or email is distinct from new.email
    );
  return new;
end;
$$;

drop trigger if exists sync_profile_identity_to_entitlement on public.profiles;
create trigger sync_profile_identity_to_entitlement
after insert or update of display_name, email on public.profiles
for each row execute function public.sync_profile_identity_to_entitlement();

create or replace function public.fill_entitlement_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_name text;
  profile_email text;
begin
  select display_name, email
  into profile_name, profile_email
  from public.profiles
  where user_id = new.user_id;

  if found then
    new.display_name := profile_name;
    new.email := profile_email;
  end if;
  return new;
end;
$$;

drop trigger if exists fill_entitlement_identity on public.entitlements;
create trigger fill_entitlement_identity
before insert on public.entitlements
for each row execute function public.fill_entitlement_identity();

commit;
