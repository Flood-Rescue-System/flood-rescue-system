-- Create public user profiles table
create table if not exists public_user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_accounts(id) not null unique,
  full_name text not null,
  address text,
  ph_number text,
  emergency_contact_name text,
  emergency_contact_phone text,
  preferred_language text default 'English',
  notification_preferences jsonb default '{"email": true, "sms": true, "push": false}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Grant permissions
grant all privileges on table public_user_profiles to anon, authenticated;

-- Create indexes
create index if not exists public_user_profiles_user_id_idx on public_user_profiles(user_id);

-- Create trigger for updating timestamp
create trigger update_public_user_profiles_updated_at
  before update on public_user_profiles
  for each row
  execute procedure update_updated_at_column(); 