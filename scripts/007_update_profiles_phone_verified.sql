-- Update profiles table to set phone_verified to true by default since we're not verifying
alter table public.profiles alter column phone_verified set default true;

-- Update existing profiles to mark phone as verified
update public.profiles set phone_verified = true where phone_number is not null;
