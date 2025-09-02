-- Create security logs table for audit trails
create table if not exists public.security_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event_type text not null, -- 'login_attempt', 'signup', 'otp_sent', 'device_verified', etc.
  event_details jsonb not null,
  ip_address inet,
  user_agent text,
  location_data jsonb,
  success boolean not null,
  risk_score integer default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.security_logs enable row level security;

-- RLS policies for security logs
create policy "logs_select_own"
  on public.security_logs for select
  using (auth.uid() = user_id);

create policy "logs_insert_own"
  on public.security_logs for insert
  with check (auth.uid() = user_id);

-- No update/delete policies for security logs (immutable audit trail)

-- Create indexes for performance
create index if not exists idx_logs_user_event on public.security_logs(user_id, event_type);
create index if not exists idx_logs_created on public.security_logs(created_at);
create index if not exists idx_logs_ip on public.security_logs(ip_address);
