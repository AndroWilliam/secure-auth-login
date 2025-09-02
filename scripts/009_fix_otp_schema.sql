create extension if not exists "pgcrypto";

-- Ensure minimal table exists (no-op if already there)
create table if not exists public.otp_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  verified boolean not null default false,
  expires_at timestamptz not null
);

-- Canonical columns (add if missing)
alter table public.otp_verifications add column if not exists type text;
alter table public.otp_verifications add column if not exists contact text;
alter table public.otp_verifications add column if not exists code text;
alter table public.otp_verifications alter column user_id drop not null;

-- Backfill from legacy names if present
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='otp_verifications' and column_name='verification_type') then
    execute $$ update public.otp_verifications set type = coalesce(type, verification_type) $$;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='otp_verifications' and column_name='contact_info') then
    execute $$ update public.otp_verifications set contact = coalesce(contact, contact_info) $$;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='otp_verifications' and column_name='otp_code') then
    execute $$ update public.otp_verifications set code = coalesce(code, otp_code) $$;
  end if;
end $$;

-- Enforce defaults and not-null (after backfill)
update public.otp_verifications set type = 'email' where type is null;
update public.otp_verifications set contact = 'unknown' where contact is null;
update public.otp_verifications set code = 'UNKNOWN' where code is null;

alter table public.otp_verifications
  alter column type set default 'email',
  alter column type set not null;

alter table public.otp_verifications
  alter column contact set not null;

alter table public.otp_verifications
  alter column code set not null;

-- Helpful indexes
drop index if exists public.otp_contact_idx;
create index if not exists otp_contact_idx on public.otp_verifications (type, contact, verified);

create index if not exists otp_lookup_idx on public.otp_verifications (type, contact, code, verified);

