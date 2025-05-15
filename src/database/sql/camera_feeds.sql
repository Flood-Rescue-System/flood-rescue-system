create table if not exists camera_feeds (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users not null,
  location_name text not null,
  feed_type text check (feed_type in ('rtsp', 'webcam', 'phone')) not null,
  config jsonb not null default '{}',
  critical_level integer,
  warning_level integer,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add RLS policies
alter table camera_feeds enable row level security;

-- Admins can manage their own camera feeds
create policy "Admins can manage their own camera feeds"
  on camera_feeds for all
  using (admin_id = auth.uid());

-- Add function to update timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_camera_feeds_updated_at
  before update on camera_feeds
  for each row
  execute function update_updated_at_column(); 