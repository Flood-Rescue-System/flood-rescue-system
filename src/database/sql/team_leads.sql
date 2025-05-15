create table if not exists team_leads (
  id uuid primary key references user_accounts(id),
  full_name text not null,
  phone_number text not null,
  alternate_phone text,
  designation text not null,
  department text not null,
  team_type text check (team_type in ('camp', 'rescue', 'resource')) not null,
  station_name text not null,
  station_address text not null,
  subdivision_id integer references subdivisions(id) not null,
  years_of_experience integer,
  specializations text[],
  available_24x7 boolean default true,
  is_profile_completed boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add RLS policies
-- alter table team_leads enable row level security;

-- Team leads can view and update their own profile
create policy "Team leads can manage their own profile"
  on team_leads for all
  using (auth.uid() = id);

-- Admins can view team leads in their subdivision
create policy "Admins can view subdivision team leads"
  on team_leads for select
  using (
    exists (
      select 1 from user_accounts
      where id = auth.uid()
      and role = 'admin'
      and subdivision_id = team_leads.subdivision_id
    )
  ); 