-- Create enum for user roles
create type user_role as enum ('admin', 'rescue', 'public');

-- Basic user details table
create table if not exists user_accounts (
  id uuid primary key,
  email text unique not null,
  phone_number text not null,
  role user_role not null,
  district_id integer references districts(id) not null,
  subdivision_id integer references subdivisions(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Grant all permissions (this makes it work without security restrictions)
grant all privileges on table user_accounts to anon, authenticated;
grant usage on schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;

-- Create function for updating timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger for updating timestamp
create trigger update_user_accounts_updated_at
  before update on user_accounts
  for each row
  execute procedure update_updated_at_column();

-- Create indexes for better query performance
create index if not exists user_accounts_email_idx on user_accounts(email);
create index if not exists user_accounts_role_idx on user_accounts(role);
create index if not exists user_accounts_district_id_idx on user_accounts(district_id);
create index if not exists user_accounts_subdivision_id_idx on user_accounts(subdivision_id);

-- Extended profile table (for future use)
create table if not exists user_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references user_accounts(id) not null,
  -- Additional fields will be added later when implementing dashboard
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create function to update timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger for updating timestamp
create trigger update_user_profiles_updated_at
  before update on user_profiles
  for each row
  execute procedure update_updated_at_column();

-- Create indexes for better query performance
create index if not exists user_profiles_user_id_idx on user_profiles(user_id); 