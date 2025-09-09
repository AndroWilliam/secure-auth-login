-- Test user_sessions functionality
-- This script tests the basic operations

-- Insert a test session (replace with a real user_id from your auth.users)
-- First, let's see what users exist
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- If you want to test with a specific user, uncomment and replace the user_id:
-- INSERT INTO public.user_sessions (user_id, last_login_at, last_seen_at, last_ip, last_device_fingerprint, last_location)
-- VALUES (
--   'your-user-id-here',
--   NOW(),
--   NOW(),
--   '192.168.1.1',
--   'test-device-fingerprint',
--   '{"city": "Test City", "country": "Test Country"}'
-- )
-- ON CONFLICT (user_id) DO UPDATE SET
--   last_login_at = EXCLUDED.last_login_at,
--   last_seen_at = EXCLUDED.last_seen_at,
--   last_ip = EXCLUDED.last_ip,
--   last_device_fingerprint = EXCLUDED.last_device_fingerprint,
--   last_location = EXCLUDED.last_location;

-- Check current sessions
SELECT 
  us.user_id,
  au.email,
  us.last_login_at,
  us.last_seen_at,
  us.last_ip,
  us.last_device_fingerprint,
  us.last_location
FROM public.user_sessions us
JOIN auth.users au ON us.user_id = au.id
ORDER BY us.last_login_at DESC;
