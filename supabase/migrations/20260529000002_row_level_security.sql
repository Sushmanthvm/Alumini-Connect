-- Row Level Security (RLS) — baseline policies for Alumni Connect
-- Run AFTER seed migration. Tune when you connect the API.

alter table public.graduation_batches enable row level security;
alter table public.degree_programs enable row level security;
alter table public.companies enable row level security;
alter table public.departments enable row level security;
alter table public.skills enable row level security;
alter table public.technologies enable row level security;
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.alumni_profiles enable row level security;
alter table public.career_entries enable row level security;
alter table public.alumni_skills enable row level security;
alter table public.alumni_technologies enable row level security;
alter table public.alumni_certifications enable row level security;
alter table public.connection_requests enable row level security;
alter table public.meetings enable row level security;
alter table public.resume_files enable row level security;
alter table public.profile_views enable row level security;
alter table public.hero_slides enable row level security;
alter table public.inspirational_quotes enable row level security;
alter table public.alumni_registration_codes enable row level security;
alter table public.password_reset_tokens enable row level security;

-- Public read: reference & CMS content
create policy "Public read graduation_batches"
  on public.graduation_batches for select to anon, authenticated using (true);

create policy "Public read degree_programs"
  on public.degree_programs for select to anon, authenticated using (true);

create policy "Public read companies"
  on public.companies for select to anon, authenticated using (true);

create policy "Public read departments"
  on public.departments for select to anon, authenticated using (true);

create policy "Public read skills"
  on public.skills for select to anon, authenticated using (true);

create policy "Public read technologies"
  on public.technologies for select to anon, authenticated using (true);

create policy "Public read hero_slides"
  on public.hero_slides for select to anon, authenticated using (true);

create policy "Public read inspirational_quotes"
  on public.inspirational_quotes for select to anon, authenticated using (true);

-- Directory: visible alumni profiles
create policy "Public read visible alumni_profiles"
  on public.alumni_profiles for select to anon, authenticated
  using (is_directory_visible = true);

create policy "Public read career_entries for visible alumni"
  on public.career_entries for select to anon, authenticated
  using (
    exists (
      select 1 from public.alumni_profiles ap
      where ap.user_id = career_entries.alumni_user_id
        and ap.is_directory_visible = true
    )
  );

create policy "Public read alumni_skills for visible alumni"
  on public.alumni_skills for select to anon, authenticated
  using (
    exists (
      select 1 from public.alumni_profiles ap
      where ap.user_id = alumni_skills.alumni_user_id
        and ap.is_directory_visible = true
    )
  );

create policy "Public read alumni_technologies for visible alumni"
  on public.alumni_technologies for select to anon, authenticated
  using (
    exists (
      select 1 from public.alumni_profiles ap
      where ap.user_id = alumni_technologies.alumni_user_id
        and ap.is_directory_visible = true
    )
  );

create policy "Public read alumni_certifications for visible alumni"
  on public.alumni_certifications for select to anon, authenticated
  using (
    exists (
      select 1 from public.alumni_profiles ap
      where ap.user_id = alumni_certifications.alumni_user_id
        and ap.is_directory_visible = true
    )
  );

-- Profiles: users read/update own row
create policy "Users read own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id);

-- Students / alumni: own row CRUD
create policy "Students manage own row"
  on public.students for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Alumni manage own alumni_profiles"
  on public.alumni_profiles for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Alumni manage own career_entries"
  on public.career_entries for all to authenticated
  using (auth.uid() = alumni_user_id)
  with check (auth.uid() = alumni_user_id);

create policy "Alumni manage own alumni_skills"
  on public.alumni_skills for all to authenticated
  using (auth.uid() = alumni_user_id)
  with check (auth.uid() = alumni_user_id);

create policy "Alumni manage own alumni_technologies"
  on public.alumni_technologies for all to authenticated
  using (auth.uid() = alumni_user_id)
  with check (auth.uid() = alumni_user_id);

create policy "Alumni manage own alumni_certifications"
  on public.alumni_certifications for all to authenticated
  using (auth.uid() = alumni_user_id)
  with check (auth.uid() = alumni_user_id);

-- Connection requests: sender & recipient
create policy "Participants read connection_requests"
  on public.connection_requests for select to authenticated
  using (auth.uid() in (sender_user_id, recipient_user_id));

create policy "Authenticated users create connection_requests"
  on public.connection_requests for insert to authenticated
  with check (auth.uid() = sender_user_id);

create policy "Recipient updates connection_requests"
  on public.connection_requests for update to authenticated
  using (auth.uid() = recipient_user_id);

-- Meetings: participants via connection request
create policy "Participants read meetings"
  on public.meetings for select to authenticated
  using (
    exists (
      select 1 from public.connection_requests cr
      where cr.id = meetings.connection_request_id
        and auth.uid() in (cr.sender_user_id, cr.recipient_user_id)
    )
  );

create policy "Recipient creates meetings"
  on public.meetings for insert to authenticated
  with check (auth.uid() = scheduled_by_user_id);

-- Resume files: owner only
create policy "Owner manages resume_files"
  on public.resume_files for all to authenticated
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

-- Profile views: authenticated users can insert; alumni can read own stats
create policy "Authenticated insert profile_views"
  on public.profile_views for insert to authenticated
  with check (true);

create policy "Alumni read own profile_views"
  on public.profile_views for select to authenticated
  using (auth.uid() = alumni_user_id);
