-- Clean up all test data and reset tables
DELETE FROM security_logs;
DELETE FROM trusted_devices;
DELETE FROM location_verifications;
DELETE FROM otp_verifications;
DELETE FROM profiles;

-- Reset any sequences if needed
-- Note: Supabase auth.users table is managed separately and may need manual cleanup
