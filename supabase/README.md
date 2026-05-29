# Alumni Connect — Supabase database setup

This folder contains SQL migrations that match the frontend (`src/lib/mock-data.ts`, auth forms, directory, inbox, meetings).

## What gets created

| Area | Tables |
|------|--------|
| Auth link | `profiles` → `auth.users` |
| Students | `students` |
| Alumni directory | `alumni_profiles`, `career_entries`, `alumni_skills`, `alumni_technologies`, `alumni_certifications` |
| Lookups | `graduation_batches`, `degree_programs`, `companies`, `departments`, `skills`, `technologies` |
| Requests | `connection_requests`, `meetings`, `resume_files` |
| Auth extras | `alumni_registration_codes`, `password_reset_tokens` |
| CMS / analytics | `hero_slides`, `inspirational_quotes`, `profile_views` |

---

## Step 1 — Create a Supabase project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **New project** → pick org, name (e.g. `alumni-connect`), database password, region
3. Wait until the project status is **Active**

Save from **Project Settings → API**:

- **Project URL** → `VITE_SUPABASE_URL` (later)
- **anon public key** → `VITE_SUPABASE_ANON_KEY` (later)
- **service_role key** → server only, never in the frontend

---

## Step 2 — Run migrations in order

Open **SQL Editor** in the left sidebar → **New query**.

Run these files **one at a time**, in order (copy entire file contents → **Run**):

1. `migrations/20260529000000_initial_schema.sql`
2. `migrations/20260529000001_seed_reference_data.sql`
3. `migrations/20260529000002_row_level_security.sql`
4. `migrations/20260529000003_storage_avatars_resumes.sql` ← **avatars & resumes**

You should see **Success. No rows returned** (or row counts for seed inserts).

---

## Step 3 — Verify tables

1. Open **Table Editor** in the sidebar
2. Confirm tables exist under `public`, e.g.:
   - `profiles`, `students`, `alumni_profiles`
   - `graduation_batches` (19 rows: 2005–2023)
   - `degree_programs` (2 rows)
   - `hero_slides` (4 rows)
   - `companies`, `inspirational_quotes`, etc.

Optional check in SQL Editor:

```sql
select year, allows_btech from public.graduation_batches order by year desc limit 5;
select code, display_name from public.degree_programs;
select title from public.hero_slides order by sort_order;
```

---

## Step 4 — Avatars & resume files (Storage)

Run migration **`20260529000003_storage_avatars_resumes.sql`** in the SQL Editor (recommended).

Or create buckets manually under **Storage**:

| Bucket    | Public? | Max size | Allowed types        |
|-----------|---------|----------|----------------------|
| `avatars` | Yes     | 5 MB     | jpeg, png, webp, gif |
| `resumes` | No      | 10 MB    | pdf, doc, docx       |

### Path conventions

**Profile photo (TopNav “Change photo”, directory cards)**

```
Bucket:  avatars
Path:    {user_id}/avatar.{ext}
Example: a1b2c3d4-e5f6-7890-abcd-ef1234567890/avatar.webp
DB:      profiles.photo_url = same path OR full public URL
```

**Resume (directory “Request guidance” dialog)**

```
Bucket:  resumes
Path:    {owner_user_id}/{resume_file_id}/{original_filename}
Example: .../f9e8d7c6-b5a4-3210-fedc-ba0987654321/resume.pdf
DB:      resume_files row, then connection_requests.resume_file_id
```

### Upload flow (when you wire the app)

**Avatar**

1. User picks image → upload to `avatars/{auth.uid()}/avatar.webp` (upsert).
2. Get public URL: `supabase.storage.from('avatars').getPublicUrl(path)`.
3. `update profiles set photo_url = path` (or save full URL).

**Resume**

1. `insert into resume_files (...)` returning `id` (or generate UUID in app).
2. Upload to `resumes/{auth.uid()}/{resume_file_id}/{filename}`.
3. `insert into connection_requests (..., resume_file_id)`.

**Who can download resumes?**

- The uploader (student)
- The alumni **recipient** (and sender) on the linked `connection_requests` row  
  (enforced by storage policy in migration 003)

### Verify in the dashboard

**Storage** → **avatars** / **resumes** buckets should appear after the migration.

```sql
select id, name, public, file_size_limit from storage.buckets
where id in ('avatars', 'resumes');
```

### Environment variables

Copy `.env.example` → `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### Auth settings (required for signup/login)

In **Authentication → Providers → Email**:

- Enable Email provider
- For local dev, turn **off** “Confirm email” so users can sign in immediately after register

Use demo alumni codes from seed data: `ALM-2019-DEMO`, `ALM-2020-DEMO`, etc.

---

## Step 5 — Auth alignment with the UI

The landing page supports:

| Role | Login fields | Suggested Supabase approach |
|------|----------------|----------------------------|
| Student | Roll number + department email + password | Sign up with **department email** as `auth.users.email`; store `roll_number` on `profiles` / `students` |
| Alumni | Email + alumni code + password | Sign up with **email**; validate `alumni_registration_codes` before activating; set `profiles.alumni_code` |

On signup, pass metadata so the trigger creates `profiles`:

```json
{
  "role": "student",
  "full_name": "Aarav Singh"
}
```

After signup you still need to insert into `students` or `alumni_profiles` (API or a second SQL function).

---

## Step 6 — Create a test alumni user (manual, for directory dev)

After enabling **Email** auth under **Authentication → Providers**:

1. **Authentication → Users → Add user** (email + password)
2. In SQL Editor, complete the profile (replace UUID):

```sql
-- Replace with your auth user id from Authentication → Users
-- update profiles set role = 'alumni', full_name = 'Priya Sharma', status = 'active' where id = 'YOUR-UUID';

-- insert into alumni_profiles (user_id, bio, job_title, location, graduation_batch_id, degree_program_id, company_id)
-- select 'YOUR-UUID', 'Passionate about infrastructure.', 'Senior SWE', 'Bangalore, IN',
--   (select id from graduation_batches where year = 2022),
--   (select id from degree_programs where code = 'btech_cys'),
--   (select id from companies where name = 'Google');
```

For bulk demo data, you can later import rows matching `src/lib/mock-data.ts`.

---

## Frontend ↔ table map

| UI | Primary tables |
|----|----------------|
| `/` register/login | `auth.users`, `profiles`, `students` / `alumni_profiles` |
| `/student` directory | `alumni_profiles` + `graduation_batches` + `degree_programs` |
| `/directory/:id` | `alumni_profiles` + child tables |
| Request guidance dialog | `connection_requests`, `resume_files` |
| `/alumni` inbox | `connection_requests`, `meetings` |
| TopNav edit profile | `profiles`, `career_entries`, Storage `avatars` |

---

## Using Supabase CLI (optional)

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

For now, running the three SQL files in the dashboard is enough.

---

## App integration (done in codebase)

The React app uses:

- `src/lib/supabase.ts` — client
- `src/contexts/AuthContext.tsx` — session state
- `src/lib/auth.ts` — register / login / logout
- `src/lib/storage.ts` — avatar & resume uploads
- `src/lib/api/*` — directory, requests, hero slides

Create `.env.local` from `.env.example`, then `npm run dev`.
