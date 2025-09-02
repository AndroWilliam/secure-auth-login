-- Create table and policy for user_info_events if missing
create extension if not exists "pgcrypto";

create table if not exists public.user_info_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  event_data jsonb not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.user_info_events enable row level security;

-- Insert policy for authenticated users (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_policies p
    join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'user_info_events' and p.polname = 'user_info_events_insert_authenticated'
  ) then
    execute $$ create policy user_info_events_insert_authenticated
      on public.user_info_events
      for insert
      to authenticated
      with check (true) $$;
  end if;
end $$;


