create table if not exists rescue_cameras (
  id uuid primary key default gen_random_uuid(),
  team_lead_id uuid references user_accounts(id) not null,
  location_name text not null,
  feed_type text not null check (feed_type in ('rtsp', 'webcam', 'phone')),
  config jsonb not null default '{}'::jsonb,
  status text not null check (status in ('online', 'offline')) default 'offline',
  subdivision_id integer references subdivisions(id) not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add RLS policies
alter table rescue_cameras enable row level security;

-- Team leads can manage their own cameras
create policy "Team leads manage own cameras"
  on rescue_cameras
  using (auth.uid() = team_lead_id);

-- Create indexes
create index rescue_cameras_team_lead_id_idx on rescue_cameras(team_lead_id);
create index rescue_cameras_subdivision_id_idx on rescue_cameras(subdivision_id); 