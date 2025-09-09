-- 1) Ensure we have helpful indexes on user_info_events
create index if not exists idx_user_info_events_user_event
  on public.user_info_events (user_id, event_type, created_at desc);

-- 2) Create a view that exposes the latest "login_completed" per user
create or replace view public.latest_login_per_user as
select distinct on (user_id)
  user_id,
  -- prefer the explicit eventTimestamp we stored; fall back to created_at
  coalesce(
    (event_data->>'eventTimestamp')::timestamptz,
    created_at
  ) as last_login_at,
  -- pull fields from the latest login_completed row
  (event_data->>'ipAddress') as last_ip,
  (event_data->>'device_id') as last_device_id,
  (event_data->'locationData'->>'city') as last_city,
  (event_data->'locationData'->>'country') as last_country
from public.user_info_events
where event_type = 'login_completed'
order by user_id, 
  coalesce(
    (event_data->>'eventTimestamp')::timestamptz,
    created_at
  ) desc;

-- 3) Helper function to fetch latest logins for a list of user ids (faster from API)
create or replace function public.get_latest_login_events(user_ids uuid[])
returns table(
  user_id uuid,
  last_login_at timestamptz,
  last_ip text,
  last_device_id text,
  last_city text,
  last_country text
)
language sql stable as $$
  select ll.user_id, ll.last_login_at, ll.last_ip, ll.last_device_id, ll.last_city, ll.last_country
  from public.latest_login_per_user ll
  where ll.user_id = any(user_ids)
$$;
