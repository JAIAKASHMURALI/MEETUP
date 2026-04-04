/* 
  MEETSYNC SUPABASE DATABASE SCHEMA
  Execute this in your Supabase SQL Editor.
*/

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text not null,
  role text check (role in ('Principal', 'HOD', 'Teacher')) not null,
  department text,
  updated_at timestamp with time zone default now()
);

-- 2. TIMETABLES TABLE
create table if not exists public.timetables (
  id uuid references auth.users on delete cascade not null primary key,
  department text not null,
  data jsonb not null,
  updated_at timestamp with time zone default now()
);

-- 3. MEETINGS TABLE
create table if not exists public.meetings (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  agenda text,
  department text not null,
  date date not null,
  time time not null,
  duration integer not null,
  created_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default now()
);

-- 4. ATTENDANCE TABLE
create table if not exists public.attendance (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  status text check (status in ('Present', 'Absent')) not null,
  created_at timestamp with time zone default now(),
  unique(user_id, date)
);

-- ROW LEVEL SECURITY (RLS) SETUP
alter table public.profiles enable row level security;
alter table public.timetables enable row level security;
alter table public.meetings enable row level security;
alter table public.attendance enable row level security;

-- POLICIES
-- Profiles: Anyone can read, users can only modify their own
create policy "Enable select for all" on public.profiles for select using (true);
create policy "Enable insert for authenticated users only" on public.profiles for insert with check (auth.role() = 'authenticated');
create policy "Enable update for owners" on public.profiles for update using (auth.uid() = id);

-- Timetables: Anyone can read (for smart scheduling), users update own
create policy "Enable select for all" on public.timetables for select using (true);
create policy "Enable upsert for owners" on public.timetables for insert with check (auth.uid() = id);
create policy "Enable update for owners" on public.timetables for update using (auth.uid() = id);

-- Meetings: Anyone can read, authenticated can insert
create policy "Enable select for all" on public.meetings for select using (true);
create policy "Enable insert for authenticated" on public.meetings for insert with check (auth.role() = 'authenticated');

-- Attendance: Anyone can read, users can update own
create policy "Enable select for all" on public.attendance for select using (true);
create policy "Enable upsert for owners" on public.attendance for insert with check (auth.uid() = user_id);
create policy "Enable update for owners" on public.attendance for update using (auth.uid() = user_id);
