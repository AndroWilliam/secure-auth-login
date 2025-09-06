-- User Roles and Permissions System
-- This script creates the necessary tables and functions for role-based access control

-- Add role and active status columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'moderator', 'viewer')),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create user_requests table for moderator requests
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

-- Enable RLS on user_requests table
ALTER TABLE user_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for user_requests table
CREATE POLICY "Users can view their own requests" ON user_requests
  FOR SELECT USING (requested_by = auth.uid());

CREATE POLICY "Moderators can create requests" ON user_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('moderator', 'admin')
    )
  );

CREATE POLICY "Admins can view all requests" ON user_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all requests" ON user_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Update profiles RLS policies to include role-based access
DROP POLICY IF EXISTS "Users can view their own profile and others can view public info" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- New policies with role-based access
CREATE POLICY "Users can view profiles based on role" ON profiles
  FOR SELECT USING (
    user_id = auth.uid() OR -- Users can see their own profile
    EXISTS (
      SELECT 1 FROM profiles viewer
      WHERE viewer.user_id = auth.uid()
      AND viewer.role IN ('admin', 'moderator', 'viewer') -- All roles can view other profiles
    )
  );

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert new profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Function to update last_active_at timestamp
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET last_active_at = NOW() 
  WHERE user_id = auth.uid();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set admin role for specific email
CREATE OR REPLACE FUNCTION set_admin_user(admin_email TEXT)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET role = 'admin'
  WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email = admin_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set androa687@gmail.com as admin
SELECT set_admin_user('androa687@gmail.com');

-- Create function to get user statistics
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at ON profiles(last_active_at);
CREATE INDEX IF NOT EXISTS idx_user_requests_status ON user_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_requests_requested_by ON user_requests(requested_by);
