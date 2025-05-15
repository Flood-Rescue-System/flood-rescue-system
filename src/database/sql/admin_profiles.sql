create table if not exists admin_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_accounts(id) not null unique,
  full_name text not null,
  designation text not null,
  office_address text not null,
  office_phone text not null,
  emergency_phone text not null,
  alternate_contact_name text not null,
  alternate_contact_phone text not null,
  preferred_language text not null default 'English',
  notification_preferences jsonb not null default '{"email": true, "sms": true, "push": false}',
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create index
create index if not exists admin_profiles_user_id_idx on admin_profiles(user_id);

-- Add RLS policies
alter table admin_profiles enable row level security;

create policy "Users can view their own profile"
  on admin_profiles for select
  using (auth.uid() = user_id);

create policy "Users can update their own profile"
  on admin_profiles for update
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on admin_profiles for insert
  with check (auth.uid() = user_id); 