create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  team_lead_id uuid references user_accounts(id) not null,
  full_name text not null,
  phone_number text not null,
  pin varchar(4) not null check (length(pin) = 4), -- Enforce 4-digit PIN
  created_at timestamp with time zone default now()
);

-- Add indexes for better performance
create index team_members_team_lead_id_idx on team_members(team_lead_id);

-- Add RLS policies
-- alter table team_members enable row level security;

-- Team leads can manage their own team members
create policy "Team leads manage own members"
  on team_members
  using (auth.uid() = team_lead_id); 