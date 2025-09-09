-- Verify user_sessions table setup
-- This script checks if the table exists and shows its structure

-- Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'user_sessions'
) as table_exists;

-- Show table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_sessions'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes 
WHERE tablename = 'user_sessions' 
AND schemaname = 'public';

-- Check RLS policies
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'user_sessions' 
AND schemaname = 'public';
