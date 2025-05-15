-- Create Donations Table
create table if not exists donations (
  id uuid default gen_random_uuid() primary key,
  donor_name text not null,
  donor_email text not null,
  amount integer not null,
  payment_id text not null,
  payment_status text default 'completed',
  message text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Add RLS Policies
alter table donations enable row level security;

-- Allow anyone to insert
create policy "Anyone can make donations"
on donations for insert
to anon
with check (true);

-- Only authenticated users can view
create policy "Authenticated users can view donations"
on donations for select
to authenticated
using (true);

-- Create trigger for updating timestamp
create trigger update_donations_updated_at
    before update on donations
    for each row
    execute procedure update_updated_at_column(); 