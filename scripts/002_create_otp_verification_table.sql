-- Create OTP verification table for email/phone verification
create table if not exists public.otp_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  verification_type text not null check (verification_type in ('email', 'phone', 'two_factor')),
  contact_info text not null, -- email or phone number
  otp_code text not null,
  expires_at timestamp with time zone not null,
  verified boolean default false,
  attempts integer default 0,
  max_attempts integer default 3,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.otp_verifications enable row level security;

-- RLS policies for OTP verifications
create policy "otp_select_own"
  on public.otp_verifications for select
  using (auth.uid() = user_id);

create policy "otp_insert_own"
  on public.otp_verifications for insert
  with check (auth.uid() = user_id);

create policy "otp_update_own"
  on public.otp_verifications for update
  using (auth.uid() = user_id);

create policy "otp_delete_own"
  on public.otp_verifications for delete
  using (auth.uid() = user_id);

-- Create index for performance
create index if not exists idx_otp_user_type on public.otp_verifications(user_id, verification_type);
create index if not exists idx_otp_expires on public.otp_verifications(expires_at);
