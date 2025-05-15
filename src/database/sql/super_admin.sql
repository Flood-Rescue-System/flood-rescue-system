-- Create super admin table
create table if not exists super_admin_accounts (
  id uuid primary key,
  email text unique not null,
  phone_number text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Grant permissions
grant all privileges on table super_admin_accounts to anon, authenticated;
grant usage on schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;

-- Create indexes
create index if not exists super_admin_accounts_email_idx on super_admin_accounts(email); 