-- Create trusted devices table for device verification
create table if not exists public.trusted_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  device_fingerprint text not null,
  device_name text,
  device_type text, -- 'desktop', 'mobile', 'tablet'
  browser_info jsonb,
  ip_address inet,
  location_info jsonb, -- city, country, etc.
  is_trusted boolean default false,
  last_used_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default (timezone('utc'::text, now()) + interval '90 days')
);

-- Enable RLS
alter table public.trusted_devices enable row level security;

-- RLS policies for trusted devices
create policy "devices_select_own"
  on public.trusted_devices for select
  using (auth.uid() = user_id);

create policy "devices_insert_own"
  on public.trusted_devices for insert
  with check (auth.uid() = user_id);

create policy "devices_update_own"
  on public.trusted_devices for update
  using (auth.uid() = user_id);

create policy "devices_delete_own"
  on public.trusted_devices for delete
  using (auth.uid() = user_id);

-- Create indexes for performance
create index if not exists idx_devices_user_fingerprint on public.trusted_devices(user_id, device_fingerprint);
create index if not exists idx_devices_expires on public.trusted_devices(expires_at);
