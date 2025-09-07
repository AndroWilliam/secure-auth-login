-- Diagnostic Script to Check Current State
-- Run this to see what's happening with your setup

-- Check if profiles table exists and its structure
SELECT 'Profiles table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if user_requests table exists
SELECT 'User requests table exists:' as info;
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'user_requests' 
  AND table_schema = 'public'
) as table_exists;

-- Check admin user status
SELECT 'Admin user check:' as info;
SELECT 
  u.email,
  p.role,
  p.is_active,
  p.created_at,
  p.updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'androa687@gmail.com';

-- Check all profiles with roles
SELECT 'All profiles with roles:' as info;
SELECT 
  id,
  role,
  is_active,
  created_at,
  updated_at
FROM profiles
WHERE role IS NOT NULL
ORDER BY created_at;

-- Check RLS policies
SELECT 'RLS policies on profiles:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'profiles';

SELECT 'RLS policies on user_requests:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'user_requests';

-- Check if get_user_stats function exists
SELECT 'get_user_stats function exists:' as info;
SELECT EXISTS (
  SELECT FROM information_schema.routines 
  WHERE routine_name = 'get_user_stats'
  AND routine_schema = 'public'
) as function_exists;
