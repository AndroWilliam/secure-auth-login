-- Update OTP table to support signup flow with email as temporary user_id
-- Modify the user_id column to allow text for signup flow
alter table public.otp_verifications alter column user_id type text;

-- Update the foreign key constraint to be more flexible
alter table public.otp_verifications drop constraint if exists otp_verifications_user_id_fkey;

-- Add a new index for email-based lookups during signup
create index if not exists idx_otp_contact_type on public.otp_verifications(contact_info, verification_type);

-- Update RLS policies to work with email-based identifiers
drop policy if exists "otp_select_own" on public.otp_verifications;
drop policy if exists "otp_insert_own" on public.otp_verifications;
drop policy if exists "otp_update_own" on public.otp_verifications;
drop policy if exists "otp_delete_own" on public.otp_verifications;

-- Create new policies that work for both authenticated users and signup flow
create policy "otp_select_flexible"
  on public.otp_verifications for select
  using (
    auth.uid()::text = user_id OR 
    (auth.uid() is null AND verification_type = 'email')
  );

create policy "otp_insert_flexible"
  on public.otp_verifications for insert
  with check (
    auth.uid()::text = user_id OR 
    (auth.uid() is null AND verification_type = 'email')
  );

create policy "otp_update_flexible"
  on public.otp_verifications for update
  using (
    auth.uid()::text = user_id OR 
    (auth.uid() is null AND verification_type = 'email')
  );

create policy "otp_delete_flexible"
  on public.otp_verifications for delete
  using (
    auth.uid()::text = user_id OR 
    (auth.uid() is null AND verification_type = 'email')
  );
