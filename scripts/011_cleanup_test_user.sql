-- Cleanup script to remove all test data for fresh testing
-- Remove all data for the test user to start fresh

-- Delete from profiles table
DELETE FROM profiles WHERE email = 'androadel150@gmail.com';

-- Delete from otp_verification table
DELETE FROM otp_verification WHERE contact = 'androadel150@gmail.com';

-- Delete from trusted_devices table (if any exist for this user)
DELETE FROM trusted_devices WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'androadel150@gmail.com'
);

-- Delete from location_verifications table (if any exist for this user)
DELETE FROM location_verifications WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'androadel150@gmail.com'
);

-- Delete from security_logs table (if any exist for this user)
DELETE FROM security_logs WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'androadel150@gmail.com'
);

-- Note: We cannot delete from auth.users as that requires admin privileges
-- The user will need to be manually removed from Supabase auth if needed

SELECT 'Cleanup completed for androadel150@gmail.com' as result;
