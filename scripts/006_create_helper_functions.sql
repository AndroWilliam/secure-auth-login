-- Helper function to generate secure OTP codes
create or replace function public.generate_otp_code()
returns text
language plpgsql
security definer
as $$
begin
  return lpad(floor(random() * 1000000)::text, 6, '0');
end;
$$;

-- Helper function to clean up expired records
create or replace function public.cleanup_expired_records()
returns void
language plpgsql
security definer
as $$
begin
  -- Clean up expired OTP verifications
  delete from public.otp_verifications 
  where expires_at < timezone('utc'::text, now());
  
  -- Clean up expired trusted devices
  delete from public.trusted_devices 
  where expires_at < timezone('utc'::text, now());
  
  -- Clean up expired location verifications
  delete from public.location_verifications 
  where expires_at < timezone('utc'::text, now());
  
  -- Clean up old security logs (keep last 90 days)
  delete from public.security_logs 
  where created_at < (timezone('utc'::text, now()) - interval '90 days');
end;
$$;

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Add updated_at trigger to profiles table
drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at_column();
