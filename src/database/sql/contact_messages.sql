-- Create Contact Messages Table
create table if not exists contact_messages (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text default 'unread',
  forwarded boolean default false,
  forwarded_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create enum for message status
create type message_status as enum ('unread', 'read', 'replied', 'archived');

-- Add RLS Policies
alter table contact_messages enable row level security;

-- Allow anyone to insert
create policy "Anyone can submit contact messages"
on contact_messages for insert
to anon
with check (true);

-- Only authenticated users can view and update
create policy "Authenticated users can view messages"
on contact_messages for select
to authenticated
using (true);

create policy "Authenticated users can update messages"
on contact_messages for update
to authenticated
using (true);

-- Create trigger for updating timestamp
create trigger update_contact_messages_updated_at
    before update on contact_messages
    for each row
    execute procedure update_updated_at_column();

-- Create function to notify on new message
create or replace function notify_new_contact_message()
returns trigger as $$
begin
  perform pg_notify(
    'new_contact_message',
    json_build_object(
      'id', NEW.id,
      'name', NEW.name,
      'email', NEW.email,
      'subject', NEW.subject,
      'message', NEW.message
    )::text
  );
  return NEW;
end;
$$ language plpgsql;

-- Create trigger for notification
create trigger notify_contact_message_inserted
  after insert on contact_messages
  for each row
  execute procedure notify_new_contact_message(); 