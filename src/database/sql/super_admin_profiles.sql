-- Create super admin profiles table
create table if not exists super_admin_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references super_admin_accounts(id) not null unique,
  full_name text not null,
  designation text,
  phone_number text,
  emergency_contact text,
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Grant permissions
grant all privileges on table super_admin_profiles to anon, authenticated;

-- Create indexes
create index if not exists super_admin_profiles_user_id_idx on super_admin_profiles(user_id); 