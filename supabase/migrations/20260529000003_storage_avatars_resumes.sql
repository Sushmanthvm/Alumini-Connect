-- Alumni Connect — Storage buckets for profile avatars & connection-request resumes
-- Run in Supabase SQL Editor AFTER the initial schema + RLS migrations.
-- Safe to re-run: uses ON CONFLICT for buckets; drops/recreates storage policies by name.

-- ---------------------------------------------------------------------------
-- Buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars',
    'avatars',
    true,
    5242880, -- 5 MB
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'resumes',
    'resumes',
    false,
    10485760, -- 10 MB
    array[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Drop existing policies (if re-running this migration)
-- ---------------------------------------------------------------------------
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Users can upload own avatar" on storage.objects;
drop policy if exists "Users can update own avatar" on storage.objects;
drop policy if exists "Users can delete own avatar" on storage.objects;
drop policy if exists "Users upload resumes to own folder" on storage.objects;
drop policy if exists "Users update own resumes" on storage.objects;
drop policy if exists "Users delete own resumes" on storage.objects;
drop policy if exists "Owner or recipient can read resumes" on storage.objects;

-- ---------------------------------------------------------------------------
-- Avatars (public bucket)
-- Path convention: {user_id}/avatar.{ext}
-- Example: a1b2c3d4-.../avatar.webp
-- Store path in profiles.photo_url OR full public URL from storage.getPublicUrl()
-- ---------------------------------------------------------------------------
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

create policy "Users can upload own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Resumes (private bucket)
-- Path convention: {owner_user_id}/{resume_file_id}/{original_filename}
-- Example: a1b2c3d4-.../f9e8d7c6-.../resume.pdf
-- Register row in public.resume_files before or after upload; link via connection_requests.resume_file_id
-- ---------------------------------------------------------------------------
create policy "Users upload resumes to own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update own resumes"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete own resumes"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner (student who uploaded) OR alumni recipient of the linked request can download
create policy "Owner or recipient can read resumes"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'resumes'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1
        from public.resume_files rf
        left join public.connection_requests cr on cr.resume_file_id = rf.id
        where rf.storage_bucket = 'resumes'
          and rf.storage_path = storage.objects.name
          and (
            rf.owner_user_id = auth.uid()
            or cr.recipient_user_id = auth.uid()
            or cr.sender_user_id = auth.uid()
          )
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Helper: build public avatar URL (for SQL checks / docs)
-- Replace YOUR_PROJECT_REF with Project Settings → General → Reference ID
-- ---------------------------------------------------------------------------
comment on column public.profiles.photo_url is
  'Storage path under avatars bucket (e.g. {user_id}/avatar.webp) or full https URL from getPublicUrl().';

comment on column public.resume_files.storage_path is
  'Object path inside resumes bucket: {owner_user_id}/{resume_file_id}/{filename}.';
