-- User Roles and Permissions System (FIXED VERSION)
-- This script creates the necessary tables and functions for role-based access control

-- First, let's check if profiles table exists and what columns it has
DO $$
BEGIN
    -- Check if profiles table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        RAISE NOTICE 'Profiles table does not exist. Creating it...';
        
        -- Create profiles table if it doesn't exist
        CREATE TABLE profiles (
            id UUID REFERENCES auth.users(id) PRIMARY KEY,
            full_name TEXT,
            email TEXT,
            phone TEXT,
            role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'moderator', 'viewer')),
            is_active BOOLEAN DEFAULT true,
            last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        RAISE NOTICE 'Profiles table exists. Adding missing columns...';
        
        -- Add role column if it doesn't exist
        BEGIN
            ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'moderator', 'viewer'));
            RAISE NOTICE 'Added role column';
        EXCEPTION
            WHEN duplicate_column THEN
                RAISE NOTICE 'Role column already exists';
        END;
        
        -- Add is_active column if it doesn't exist
        BEGIN
            ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
            RAISE NOTICE 'Added is_active column';
        EXCEPTION
            WHEN duplicate_column THEN
                RAISE NOTICE 'is_active column already exists';
        END;
        
        -- Add last_active_at column if it doesn't exist
        BEGIN
            ALTER TABLE profiles ADD COLUMN last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added last_active_at column';
        EXCEPTION
            WHEN duplicate_column THEN
                RAISE NOTICE 'last_active_at column already exists';
        END;
        
        -- Add created_by column if it doesn't exist
        BEGIN
            ALTER TABLE profiles ADD COLUMN created_by UUID REFERENCES auth.users(id);
            RAISE NOTICE 'Added created_by column';
        EXCEPTION
            WHEN duplicate_column THEN
                RAISE NOTICE 'created_by column already exists';
        END;
        
        -- Add updated_at column if it doesn't exist
        BEGIN
            ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column';
        EXCEPTION
            WHEN duplicate_column THEN
                RAISE NOTICE 'updated_at column already exists';
        END;
    END IF;
END $$;

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

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_requests table
ALTER TABLE user_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile and others can view public info" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert new profiles" ON profiles;

-- Create policies for profiles table (works with both id and user_id columns)
CREATE POLICY "Users can view profiles based on role" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR -- Users can see their own profile (if using id column)
    COALESCE(user_id, id) = auth.uid() OR -- Fallback for user_id column
    EXISTS (
      SELECT 1 FROM profiles viewer
      WHERE COALESCE(viewer.user_id, viewer.id) = auth.uid()
      AND viewer.role IN ('admin', 'moderator', 'viewer') -- All roles can view other profiles
    )
  );

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (
    id = auth.uid() OR COALESCE(user_id, id) = auth.uid()
  )
  WITH CHECK (
    id = auth.uid() OR COALESCE(user_id, id) = auth.uid()
  );

CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE COALESCE(user_id, id) = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert new profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE COALESCE(user_id, id) = auth.uid() 
      AND role = 'admin'
    )
  );

-- Create policies for user_requests table
CREATE POLICY "Users can view their own requests" ON user_requests
  FOR SELECT USING (requested_by = auth.uid());

CREATE POLICY "Moderators can create requests" ON user_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE COALESCE(user_id, id) = auth.uid() 
      AND role IN ('moderator', 'admin')
    )
  );

CREATE POLICY "Admins can view all requests" ON user_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE COALESCE(user_id, id) = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all requests" ON user_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE COALESCE(user_id, id) = auth.uid() 
      AND role = 'admin'
    )
  );

-- Function to update last_active_at timestamp
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET last_active_at = NOW() 
  WHERE COALESCE(user_id, id) = auth.uid();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set admin role for specific email
CREATE OR REPLACE FUNCTION set_admin_user(admin_email TEXT)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET role = 'admin', is_active = true, updated_at = NOW()
  WHERE COALESCE(user_id, id) IN (
    SELECT id FROM auth.users 
    WHERE email = admin_email
  );
  
  -- If no profile exists, create one
  IF NOT FOUND THEN
    INSERT INTO profiles (id, email, role, is_active, created_at, updated_at)
    SELECT id, email, 'admin', true, NOW(), NOW()
    FROM auth.users 
    WHERE email = admin_email
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      is_active = true,
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
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

-- Set androa687@gmail.com as admin
SELECT set_admin_user('androa687@gmail.com');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at ON profiles(last_active_at);
CREATE INDEX IF NOT EXISTS idx_user_requests_status ON user_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_requests_requested_by ON user_requests(requested_by);

-- Final success message
DO $$
BEGIN
  RAISE NOTICE 'User management system setup completed successfully!';
  RAISE NOTICE 'Admin user androa687@gmail.com has been configured.';
  RAISE NOTICE 'You can now refresh your dashboard to access User Management features.';
END $$;
