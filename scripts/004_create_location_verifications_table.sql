-- Create location verifications table for location-based security
create table if not exists public.location_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  ip_address inet not null,
  location_data jsonb not null, -- city, country, coordinates, etc.
  verification_method text not null check (verification_method in ('ip_geolocation', 'gps', 'manual')),
  is_verified boolean default false,
  risk_score integer default 0 check (risk_score >= 0 and risk_score <= 100),
  verification_token text,
  expires_at timestamp with time zone default (timezone('utc'::text, now()) + interval '24 hours'),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.location_verifications enable row level security;

-- RLS policies for location verifications
create policy "location_select_own"
  on public.location_verifications for select
  using (auth.uid() = user_id);

create policy "location_insert_own"
  on public.location_verifications for insert
  with check (auth.uid() = user_id);

create policy "location_update_own"
  on public.location_verifications for update
  using (auth.uid() = user_id);

create policy "location_delete_own"
  on public.location_verifications for delete
  using (auth.uid() = user_id);

-- Create indexes for performance
create index if not exists idx_location_user_ip on public.location_verifications(user_id, ip_address);
create index if not exists idx_location_expires on public.location_verifications(expires_at);
