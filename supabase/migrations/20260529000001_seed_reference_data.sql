-- Alumni Connect — seed reference & CMS data (matches src/lib/mock-data.ts)
-- Run AFTER 20260529000000_initial_schema.sql

-- Degree programs (DirectoryExplorer)
insert into public.degree_programs (code, display_name) values
  ('btech_cys', 'B.tech CYS'),
  ('mtech_cys', 'M.tech CYS')
on conflict (code) do nothing;

-- Graduation batches 2005–2023 (allows_btech when year >= 2021)
insert into public.graduation_batches (year, allows_btech)
select y, (y >= 2021)
from generate_series(2005, 2023) as y
on conflict (year) do nothing;

-- Departments (from mentee request mock data)
insert into public.departments (code, name) values
  ('CS', 'Computer Science'),
  ('IT', 'Information Technology'),
  ('ECE', 'Electronics & Communication'),
  ('CYS_BTECH', 'B.tech CYS'),
  ('CYS_MTECH', 'M.tech CYS')
on conflict (code) do nothing;

-- Companies (student dashboard marquee + alumni employers)
insert into public.companies (name) values
  ('Google'),
  ('Microsoft'),
  ('Amazon'),
  ('Zoho'),
  ('TCS'),
  ('Stripe'),
  ('Netflix'),
  ('Figma'),
  ('Notion'),
  ('Linear'),
  ('Tesla'),
  ('Meta'),
  ('Flipkart'),
  ('Razorpay'),
  ('Mu Sigma'),
  ('Walmart Labs'),
  ('Postman'),
  ('Bosch'),
  ('Ather Energy'),
  ('Atlassian'),
  ('Hotstar')
on conflict (name) do nothing;

-- Hero slides
insert into public.hero_slides (title, subtitle, image_url, sort_order) values
  (
    'Find Your Mentor',
    'Connect with alumni who walked the path you dream of walking.',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80',
    1
  ),
  (
    'Unlock Referrals',
    'Get your resume into the right hands at the world''s top companies.',
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80',
    2
  ),
  (
    'Build Your Network',
    'A single conversation can change the entire trajectory of your career.',
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1600&q=80',
    3
  ),
  (
    'Learn From The Best',
    'Real stories. Real careers. Real advice — from people who''ve been there.',
    'https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?auto=format&fit=crop&w=1600&q=80',
    4
  );

-- Inspirational quotes
insert into public.inspirational_quotes (body) values
  ('The bridge between where you are and where you want to be is built by those who walked it first.'),
  ('Mentorship is the shortcut nobody talks about — until you find it.'),
  ('Every alumnus was once a student staring at the same horizon.'),
  ('Your network is your net worth — start building it today.'),
  ('Behind every great career is a community that believed first.');

-- Sample alumni registration codes
insert into public.alumni_registration_codes (code, batch_year) values
  ('ALM-2018-DEMO', 2018),
  ('ALM-2019-DEMO', 2019),
  ('ALM-2020-DEMO', 2020),
  ('ALM-2022-DEMO', 2022)
on conflict (code) do nothing;
