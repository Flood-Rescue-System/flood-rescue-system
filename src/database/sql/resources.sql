create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  team_lead_id uuid references user_accounts(id) not null,
  name text not null,
  type text not null check (type in ('food', 'clothing', 'transport', 'medical', 'shelter', 'other')),
  quantity integer not null check (quantity >= 0),
  unit text not null,
  provider_name text not null,
  provider_type text not null check (provider_type in ('shop', 'industry', 'company', 'individual', 'other')),
  contact_number text not null,
  location text not null,
  notes text,
  status text not null check (status in ('available', 'low', 'unavailable')) default 'available',
  subdivision_id integer references subdivisions(id) not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add RLS policies
alter table resources enable row level security;

-- Team leads can manage their own resources
create policy "Team leads manage own resources"
  on resources
  using (auth.uid() = team_lead_id);

-- Create indexes
create index resources_team_lead_id_idx on resources(team_lead_id);
create index resources_subdivision_id_idx on resources(subdivision_id); 