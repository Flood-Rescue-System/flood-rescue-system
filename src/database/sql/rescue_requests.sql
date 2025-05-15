-- Create rescue requests table
create table if not exists rescue_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_accounts(id) not null,
  status text not null check (status in ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  location jsonb not null,
  affected_people integer not null default 1,
  water_level text not null check (water_level in ('ankle', 'knee', 'waist', 'chest', 'above_head')),
  medical_assistance_needed boolean default false,
  description text,
  priority text not null check (priority in ('high', 'medium', 'low')),
  assigned_team_id uuid references user_accounts(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add indexes
create index rescue_requests_user_id_idx on rescue_requests(user_id);
create index rescue_requests_status_idx on rescue_requests(status);
create index rescue_requests_assigned_team_id_idx on rescue_requests(assigned_team_id);

-- Add trigger for updating timestamp
create trigger update_rescue_requests_updated_at
  before update on rescue_requests
  for each row
  execute procedure update_updated_at_column();

-- Grant permissions
grant all privileges on table rescue_requests to anon, authenticated; 