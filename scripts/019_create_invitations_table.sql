-- Create Invitations Table for User Management
-- This script creates the necessary tables and enums for the invitation system

-- Create enums
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
  CREATE TYPE user_role_enum AS ENUM ('admin','moderator','viewer');
END IF;
IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invitation_status_enum') THEN
  CREATE TYPE invitation_status_enum AS ENUM ('inviting','pending_admin','invited','accepted','rejected','expired');
END IF;
END $$;

-- Create user_invitations table
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  role user_role_enum NOT NULL DEFAULT 'viewer',
  status invitation_status_enum NOT NULL,
  token TEXT UNIQUE,
  expires_at TIMESTAMPTZ,
  requested_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_invitations_email_idx ON public.user_invitations (email);
CREATE INDEX IF NOT EXISTS user_invitations_status_idx ON public.user_invitations (status);
CREATE INDEX IF NOT EXISTS user_invitations_token_idx ON public.user_invitations (token);
CREATE INDEX IF NOT EXISTS user_invitations_requested_by_idx ON public.user_invitations (requested_by);
CREATE INDEX IF NOT EXISTS user_invitations_approved_by_idx ON public.user_invitations (approved_by);

-- Enable Row Level Security
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow authenticated users to read invitations
CREATE POLICY user_invitations_read
ON public.user_invitations FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert invitations
CREATE POLICY user_invitations_insert
ON public.user_invitations FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update invitations
CREATE POLICY user_invitations_update
ON public.user_invitations FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete invitations
CREATE POLICY user_invitations_delete
ON public.user_invitations FOR DELETE
TO authenticated
USING (true);

-- Create a view for user management that combines users and invitations
-- Note: This view will be created after we verify the actual column names in profiles table
-- For now, we'll create a basic view that works with the current schema

CREATE OR REPLACE VIEW public.user_management_view AS
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

-- Create a function to clean up expired invitations
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  DELETE FROM public.user_invitations 
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW() 
    AND status IN ('invited', 'pending_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to automatically update invitation status when user signs up
CREATE OR REPLACE FUNCTION public.handle_user_signup()
RETURNS trigger AS $$
BEGIN
  -- Update any pending invitations for this email
  UPDATE public.user_invitations 
  SET status = 'accepted', updated_at = NOW()
  WHERE email = NEW.email 
    AND status IN ('invited', 'pending_admin');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to handle user signup
DROP TRIGGER IF EXISTS on_user_signup ON auth.users;
CREATE TRIGGER on_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_signup();

-- Insert some sample data for testing (optional)
-- INSERT INTO public.user_invitations (email, name, role, status, requested_by) VALUES
-- ('test@example.com', 'Test User', 'viewer', 'inviting', (SELECT id FROM auth.users WHERE email = 'androa687@gmail.com' LIMIT 1));
