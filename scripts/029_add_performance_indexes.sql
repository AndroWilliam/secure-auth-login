-- Speeds up detail lookups
create index if not exists idx_user_info_events_user_type_created
on public.user_info_events (user_id, event_type, created_at desc);
