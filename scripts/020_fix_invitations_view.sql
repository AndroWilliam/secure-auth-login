-- Fix Invitations View - Check Schema First
-- This script checks the current profiles table schema and creates the correct view

-- First, let's check what columns exist in the profiles table
-- Run this query first to see the actual column names:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' AND table_schema = 'public';

-- Drop the existing view if it exists
DROP VIEW IF EXISTS public.user_management_view;

-- Create a basic view that works with the current schema
-- This will be updated once we know the actual column names
CREATE VIEW public.user_management_view AS
SELECT 
  u.id,
  u.email,
  COALESCE(i.name, 'No Name') as full_name,
  NULL as phone,
  COALESCE(i.role::text, 'viewer') as role,
  CASE 
    WHEN i.id IS NOT NULL THEN i.status::text
    ELSE 'inactive'
  END as status,
  COALESCE(i.created_at, u.created_at) as created_at,
  COALESCE(i.updated_at, u.updated_at) as updated_at
FROM auth.users u
LEFT JOIN public.user_invitations i ON u.email = i.email
WHERE u.email IS NOT NULL;

-- Grant access to the view
GRANT SELECT ON public.user_management_view TO authenticated;

-- Alternative view that includes profiles data (uncomment and modify based on actual schema)
/*
CREATE OR REPLACE VIEW public.user_management_view AS
SELECT 
  u.id,
  u.email,
  COALESCE(p.display_name, i.name, 'No Name') as full_name,
  COALESCE(p.phone_number, NULL) as phone,
  COALESCE(p.role::text, i.role::text, 'viewer') as role,
  CASE 
    WHEN i.id IS NOT NULL THEN i.status::text
    WHEN p.last_active_at IS NOT NULL AND p.last_active_at > NOW() - INTERVAL '5 minutes' THEN 'active'
    WHEN p.last_active_at IS NOT NULL AND p.last_active_at > NOW() - INTERVAL '30 minutes' THEN 'idle'
    ELSE 'inactive'
  END as status,
  COALESCE(p.created_at, i.created_at, u.created_at) as created_at,
  COALESCE(p.updated_at, i.updated_at, u.updated_at) as updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_invitations i ON u.email = i.email
WHERE u.email IS NOT NULL;
*/
