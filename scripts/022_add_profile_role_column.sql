-- Add role column to profiles table for admin-edited roles
-- This allows admins to override the default role resolution

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role text DEFAULT 'viewer';

-- Add helpful index for user detail lookups
CREATE INDEX IF NOT EXISTS idx_user_info_events_userid_type_created
ON public.user_info_events (user_id, event_type, created_at DESC);

-- Update the profiles table to ensure it has the necessary columns
-- (These might already exist, but adding IF NOT EXISTS for safety)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS phone_number text;

-- Ensure RLS is properly configured for profiles
-- (Service role will bypass RLS for admin operations)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Basic RLS policy for profiles (allow authenticated users to read)
CREATE POLICY IF NOT EXISTS profiles_read_policy ON public.profiles
FOR SELECT TO authenticated
USING (true);

-- Allow service role to bypass RLS for admin operations
CREATE POLICY IF NOT EXISTS profiles_service_policy ON public.profiles
FOR ALL TO service_role
USING (true)
WITH CHECK (true);
