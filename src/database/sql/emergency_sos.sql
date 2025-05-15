-- Create Emergency SOS Table
create table if not exists emergency_sos (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text not null,
  affected_people integer not null,
  water_level text not null,
  medical_assistance text,
  latitude text not null,
  longitude text not null,
  status text default 'pending',
  team_lead_id uuid references team_leads(id),
  assignment_status text default 'unassigned',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create status enum type
create type emergency_status as enum ('pending', 'assigned', 'in_progress', 'resolved');

-- Create assignment status enum type
create type assignment_status as enum ('unassigned', 'pending_acceptance', 'accepted', 'rejected', 'completed');

-- Create rescue assignments table to track assignments
create table if not exists rescue_assignments (
  id uuid default gen_random_uuid() primary key,
  emergency_id uuid references emergency_sos(id) not null,
  team_lead_id uuid references team_leads(id) not null,
  status text default 'pending_acceptance',
  assigned_by uuid references admin_profiles(user_id),
  assigned_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  notes text,
  unique(emergency_id, team_lead_id)
);

-- Add RLS (Row Level Security) Policies
alter table emergency_sos enable row level security;
alter table rescue_assignments enable row level security;

-- Allow anyone to insert (since it's public emergency form)
create policy "Anyone can create emergency requests"
on emergency_sos for insert
to anon
with check (true);

-- Only authenticated users can view
create policy "Authenticated users can view emergency requests"
on emergency_sos for select
to authenticated
using (true);

-- Allow authenticated users to update emergency requests
create policy "Authenticated users can update emergency requests"
on emergency_sos for update
to authenticated
using (true);

-- Allow authenticated users to view rescue assignments
create policy "Authenticated users can view rescue assignments"
on rescue_assignments for select
to authenticated
using (true);

-- Allow authenticated users to update rescue assignments
create policy "Authenticated users can update rescue assignments"
on rescue_assignments for update
to authenticated
using (true);

-- Allow authenticated users to insert rescue assignments
create policy "Authenticated users can insert rescue assignments"
on rescue_assignments for insert
to authenticated
with check (true);

-- Create function to update timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create trigger for updating timestamp
create trigger update_emergency_sos_updated_at
    before update on emergency_sos
    for each row
    execute procedure update_updated_at_column();

-- Create trigger for updating timestamp in rescue assignments
create trigger update_rescue_assignments_updated_at
    before update on rescue_assignments
    for each row
    execute procedure update_updated_at_column(); 