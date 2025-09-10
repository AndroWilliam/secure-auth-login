-- Create composite index to accelerate the latest-login lookup
create index if not exists idx_user_info_events_user_event_time
on public.user_info_events (user_id, event_type, created_at desc);
