-- Simple fix for existing profiles table
-- This assumes your profiles table already exists with 'id' as the primary key

-- First, let's see what we're working with
SELECT 'Current profiles table structure:' as info;
\d profiles;

-- Add the missing columns to your existing profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'moderator', 'viewer'));

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create user_requests table
CREATE TABLE IF NOT EXISTS user_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_by UUID REFERENCES auth.users(id) NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('add_user', 'delete_user', 'edit_user')),
  request_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_requests ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies first to start clean
DROP POLICY IF EXISTS "Users can view profiles based on role" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert new profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own requests" ON user_requests;
DROP POLICY IF EXISTS "Moderators can create requests" ON user_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON user_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON user_requests;

-- Create NEW policies that ONLY use 'id' column (no user_id references)
CREATE POLICY "Users can view profiles based on role" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR -- Users can see their own profile
    EXISTS (
      SELECT 1 FROM profiles viewer
      WHERE viewer.id = auth.uid()
      AND viewer.role IN ('admin', 'moderator', 'viewer')
    )
  );

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert new profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- User requests policies
CREATE POLICY "Users can view their own requests" ON user_requests
  FOR SELECT USING (requested_by = auth.uid());

CREATE POLICY "Moderators can create requests" ON user_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('moderator', 'admin')
    )
  );

CREATE POLICY "Admins can view all requests" ON user_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all requests" ON user_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Helper functions
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE(
  total_users BIGINT,
  active_users BIGINT,
  admins BIGINT,
  moderators BIGINT,
  viewers BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
    COUNT(CASE WHEN role = 'moderator' THEN 1 END) as moderators,
    COUNT(CASE WHEN role = 'viewer' THEN 1 END) as viewers
  FROM profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set admin user (this will work regardless of whether the profile exists)
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the user ID for the admin email
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'androa687@gmail.com';
    
    IF admin_user_id IS NOT NULL THEN
        -- Update existing profile or insert new one
        INSERT INTO profiles (id, email, role, is_active, created_at, updated_at)
        VALUES (admin_user_id, 'androa687@gmail.com', 'admin', true, NOW(), NOW())
        ON CONFLICT (id) 
        DO UPDATE SET 
            role = 'admin',
            is_active = true,
            updated_at = NOW();
        
        RAISE NOTICE 'Admin user androa687@gmail.com has been configured successfully!';
    ELSE
        RAISE NOTICE 'User androa687@gmail.com not found in auth.users table';
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at ON profiles(last_active_at);
CREATE INDEX IF NOT EXISTS idx_user_requests_status ON user_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_requests_requested_by ON user_requests(requested_by);

-- Final message
SELECT 'Setup completed! Refresh your dashboard to see User Management features.' as result;
