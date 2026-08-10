-- Alumni Connect — RESET partial schema, then create everything cleanly
-- Run this ENTIRE file once in Supabase SQL Editor.
-- WARNING: deletes existing Alumni Connect public tables/types (no app data kept).

-- ---------------------------------------------------------------------------
-- 1) Drop dependent objects first (order matters)
-- ---------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.set_updated_at() cascade;

drop table if exists public.profile_views cascade;
drop table if exists public.inspirational_quotes cascade;
drop table if exists public.hero_slides cascade;
drop table if exists public.password_reset_tokens cascade;
drop table if exists public.alumni_registration_codes cascade;
drop table if exists public.meetings cascade;
drop table if exists public.connection_requests cascade;
drop table if exists public.resume_files cascade;
drop table if exists public.alumni_certifications cascade;
drop table if exists public.alumni_technologies cascade;
drop table if exists public.alumni_skills cascade;
drop table if exists public.career_entries cascade;
drop table if exists public.alumni_profiles cascade;
drop table if exists public.students cascade;
drop table if exists public.profiles cascade;
drop table if exists public.technologies cascade;
drop table if exists public.skills cascade;
drop table if exists public.departments cascade;
drop table if exists public.companies cascade;
drop table if exists public.degree_programs cascade;
drop table if exists public.graduation_batches cascade;

drop type if exists public.connection_status cascade;
drop type if exists public.connection_intent cascade;
drop type if exists public.user_status cascade;
drop type if exists public.user_role cascade;

-- ---------------------------------------------------------------------------
-- 2) Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 3) Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('student', 'alumni');

create type public.user_status as enum (
  'active',
  'suspended',
  'pending_verification'
);

create type public.connection_intent as enum ('referral', 'mentoring');

create type public.connection_status as enum (
  'pending',
  'denied',
  'accepted',
  'cancelled'
);

-- ---------------------------------------------------------------------------
-- 4) Utility
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5) Reference tables
-- ---------------------------------------------------------------------------
create table public.graduation_batches (
  id smallserial primary key,
  year smallint not null unique,
  allows_btech boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.degree_programs (
  id smallserial primary key,
  code text not null unique,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.companies (
  id serial primary key,
  name text not null unique,
  logo_url text,
  created_at timestamptz not null default now()
);

create table public.departments (
  id smallserial primary key,
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.skills (
  id serial primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.technologies (
  id serial primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6) Profiles + role tables
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  full_name text not null,
  photo_url text,
  status public.user_status not null default 'pending_verification',
  roll_number text,
  department_email text,
  alumni_code text,
  personal_email text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_roll_number_unique unique (roll_number),
  constraint profiles_department_email_unique unique (department_email),
  constraint profiles_alumni_code_unique unique (alumni_code),
  constraint profiles_personal_email_unique unique (personal_email)
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create index profiles_role_idx on public.profiles (role);

create table public.students (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  department_id smallint references public.departments (id),
  department text,
  semester smallint check (semester between 1 and 8),
  degree_program_id smallint references public.degree_programs (id),
  expected_graduation_year smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger students_set_updated_at
before update on public.students
for each row execute function public.set_updated_at();

create table public.alumni_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  bio text,
  company_id integer references public.companies (id),
  job_title text,
  location text,
  graduation_batch_id smallint references public.graduation_batches (id),
  degree_program_id smallint references public.degree_programs (id),
  is_directory_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger alumni_profiles_set_updated_at
before update on public.alumni_profiles
for each row execute function public.set_updated_at();

create index alumni_profiles_directory_idx
  on public.alumni_profiles (graduation_batch_id, degree_program_id)
  where is_directory_visible = true;

-- ---------------------------------------------------------------------------
-- 7) Alumni details
-- ---------------------------------------------------------------------------
create table public.career_entries (
  id uuid primary key default gen_random_uuid(),
  alumni_user_id uuid not null references public.alumni_profiles (user_id) on delete cascade,
  year smallint not null,
  company_name text not null,
  role_title text not null,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create index career_entries_alumni_idx on public.career_entries (alumni_user_id, sort_order);

create table public.alumni_skills (
  alumni_user_id uuid not null references public.alumni_profiles (user_id) on delete cascade,
  skill_id integer not null references public.skills (id) on delete cascade,
  primary key (alumni_user_id, skill_id)
);

create table public.alumni_technologies (
  alumni_user_id uuid not null references public.alumni_profiles (user_id) on delete cascade,
  technology_id integer not null references public.technologies (id) on delete cascade,
  primary key (alumni_user_id, technology_id)
);

create table public.alumni_certifications (
  id uuid primary key default gen_random_uuid(),
  alumni_user_id uuid not null references public.alumni_profiles (user_id) on delete cascade,
  name text not null,
  issued_year smallint,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 8) Requests / meetings / files
-- ---------------------------------------------------------------------------
create table public.resume_files (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles (id) on delete cascade,
  storage_bucket text not null default 'resumes',
  storage_path text not null,
  original_filename text not null,
  mime_type text,
  size_bytes integer,
  created_at timestamptz not null default now()
);

create table public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references public.profiles (id) on delete cascade,
  recipient_user_id uuid not null references public.profiles (id) on delete cascade,
  intent public.connection_intent not null,
  status public.connection_status not null default 'pending',
  subject text,
  message text not null,
  reply_email text not null,
  resume_file_id uuid references public.resume_files (id) on delete set null,
  denied_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint connection_requests_no_self_send check (sender_user_id <> recipient_user_id)
);

create trigger connection_requests_set_updated_at
before update on public.connection_requests
for each row execute function public.set_updated_at();

create index connection_requests_recipient_status_idx
  on public.connection_requests (recipient_user_id, status);

create index connection_requests_sender_idx
  on public.connection_requests (sender_user_id);

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  connection_request_id uuid not null unique references public.connection_requests (id) on delete cascade,
  scheduled_by_user_id uuid not null references public.profiles (id),
  meeting_date date not null,
  start_time time not null,
  end_time time not null,
  timezone text not null default 'Asia/Kolkata',
  google_calendar_event_id text,
  created_at timestamptz not null default now()
);

create table public.alumni_registration_codes (
  code text primary key,
  batch_year smallint not null,
  is_used boolean not null default false,
  used_by_user_id uuid references public.profiles (id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  email text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index password_reset_tokens_user_idx on public.password_reset_tokens (user_id);

create table public.profile_views (
  id bigserial primary key,
  alumni_user_id uuid not null references public.alumni_profiles (user_id) on delete cascade,
  viewer_user_id uuid references public.profiles (id) on delete set null,
  viewed_at timestamptz not null default now()
);

create index profile_views_alumni_idx on public.profile_views (alumni_user_id, viewed_at desc);

create table public.hero_slides (
  id serial primary key,
  title text not null,
  subtitle text not null,
  image_url text not null,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.inspirational_quotes (
  id serial primary key,
  body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 9) Auth trigger: create profile on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, personal_email, status)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'student'),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    'pending_verification'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 10) Quick verify (should return 3)
-- ---------------------------------------------------------------------------
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'students', 'alumni_profiles')
order by table_name;
