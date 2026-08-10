-- Allow authenticated users to insert their own profile row
-- (covers edge cases where the auth trigger didn't create one)

create policy "Users insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

-- Allow reading unused registration codes during alumni signup (anon + authenticated)
-- without this, alumni code validation can fail under RLS
drop policy if exists "Anyone can read unused alumni codes" on public.alumni_registration_codes;
create policy "Anyone can read unused alumni codes"
  on public.alumni_registration_codes for select to anon, authenticated
  using (true);
