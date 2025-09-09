-- user_sessions: tracks last login + live presence + last security context
create table if not exists public.user_sessions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_login_at timestamptz,
  last_seen_at timestamptz,
  last_ip text,
  last_device_fingerprint text,
  last_location jsonb
);

create index if not exists idx_user_sessions_last_seen_at on public.user_sessions(last_seen_at);
create index if not exists idx_user_sessions_last_login_at on public.user_sessions(last_login_at);

-- Optional: speed up user_info_events queries for last login metadata
create index if not exists idx_user_info_events_user_type_created
  on public.user_info_events (user_id, event_type, created_at desc);

-- Enable RLS on user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Allow service role to bypass RLS for admin operations
CREATE POLICY IF NOT EXISTS user_sessions_service_policy ON public.user_sessions
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to read their own session data
CREATE POLICY IF NOT EXISTS user_sessions_read_own ON public.user_sessions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);
