-- Make user_id nullable to support signup flow before user creation
ALTER TABLE otp_verifications ALTER COLUMN user_id DROP NOT NULL;

-- Add index for efficient lookups during signup
CREATE INDEX IF NOT EXISTS otp_contact_type_idx ON otp_verifications (type, contact, verified);

-- Update RLS policy to allow service role operations
DROP POLICY IF EXISTS "Users can manage their own OTP verifications" ON otp_verifications;

-- Allow service role to manage all OTP records
CREATE POLICY "Service role can manage OTP verifications" ON otp_verifications
  FOR ALL USING (auth.role() = 'service_role');

-- Allow users to read their own OTP records (for authenticated operations)
CREATE POLICY "Users can read their own OTP verifications" ON otp_verifications
  FOR SELECT USING (auth.uid() = user_id);
