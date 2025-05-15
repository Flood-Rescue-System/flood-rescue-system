create table if not exists camps (
  id uuid primary key default gen_random_uuid(),
  team_lead_id uuid references user_accounts(id) not null,
  name text not null,
  location text not null,
  capacity integer not null check (capacity > 0),
  current_occupancy integer not null default 0 check (current_occupancy >= 0),
  status text check (status in ('active', 'full', 'closed')) not null default 'active',
  contact_number text not null,
  facilities text[] not null default '{}',
  address text not null,
  subdivision_id integer references subdivisions(id) not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add RLS policies
alter table camps enable row level security;

-- Team leads can manage their own camps
create policy "Team leads manage own camps"
  on camps
  using (auth.uid() = team_lead_id);

-- Create index for better performance
create index camps_team_lead_id_idx on camps(team_lead_id);
create index camps_subdivision_id_idx on camps(subdivision_id); 