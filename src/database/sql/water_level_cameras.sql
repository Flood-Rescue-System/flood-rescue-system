-- Enable required extensions
create extension if not exists "moddatetime";


-- Create water_level_cameras table
create table public.water_level_cameras (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid references auth.users(id) on delete cascade,
  name text not null,
  roi_coords jsonb not null,
  max_value integer not null,
  min_value integer not null,
  threshold integer not null,
  current_level integer,
  status text default 'active' check (status in ('active', 'inactive', 'error')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- -- Enable RLS
-- alter table public.water_level_cameras enable row level security;

-- -- Create policies
-- create policy "Enable read access for authenticated users" on public.water_level_cameras
--   for select using (auth.role() = 'authenticated');

-- create policy "Enable insert for authenticated users" on public.water_level_cameras
--   for insert with check (auth.role() = 'authenticated');

-- create policy "Enable update for admin users" on public.water_level_cameras
--   for update using (auth.uid() = admin_id);

-- create policy "Enable delete for admin users" on public.water_level_cameras
--   for delete using (auth.uid() = admin_id);

-- Create updated_at trigger
create trigger handle_updated_at before update on public.water_level_cameras
  for each row execute procedure moddatetime (updated_at);