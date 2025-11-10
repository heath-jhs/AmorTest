-- supabase/migrations/01_init.sql
-- AMORTEST Database Schema (FINAL: Trigger for response_date)

begin;

-- Enable extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Users
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  partner_id uuid references profiles(id),
  display_name text not null,
  onboarding_completed boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  sensory_weight float default 0.5,
  playfulness_weight float default 0.5,
  embodiment_weight float default 0.5,
  nostalgia_weight float default 0.5,
  autonomy_weight float default 0.5,
  transcendence_weight float default 0.5,
  temporal_weight float default 0.5,

  daily_reminder_time time default '09:00',
  encryption_passphrase_hash text,
  out_of_bounds_questions uuid[] default '{}'
);

-- Questions
create table questions (
  id uuid primary key default uuid_generate_v4(),
  text text not null,
  type text check (type in ('likert', 'emoji', 'freetext')) default 'likert',
  construct1 text,
  construct2 text,
  weight float default 1.0,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- User Responses
create table responses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  response_likert int check (response_likert between 1 and 5),
  response_emoji text,
  response_text text,
  responded_at timestamp with time zone default now(),
  response_date date not null default current_date,
  constraint one_response_per_day unique (user_id, question_id, response_date)
);

-- Trigger function
create or replace function set_response_date()
returns trigger as $$
begin
  new.response_date := date_trunc('day', new.responded_at)::date;
  return new;
end;
$$ language plpgsql;

-- Trigger
create trigger trg_set_response_date
  before insert or update on responses
  for each row
  execute function set_response_date();

-- Daily Sync
create table daily_syncs (
  id uuid primary key default uuid_generate_v4(),
  couple_id text not null,
  date date not null default current_date,
  score float check (score between 0 and 100),
  suggestion_type text check (suggestion_type in ('intimate', 'platonic', 'neutral')),
  created_at timestamp with time zone default now(),
  unique(couple_id, date)
);

-- Activities
create table activities (
  id uuid primary key default uuid_generate_v4(),
  text text not null,
  type text check (type in ('intimate', 'platonic', 'neutral')),
  duration_minutes int,
  requires_touch boolean default false,
  tags text[] default '{}',
  active boolean default true
);

-- Encrypted Messages
create table encrypted_messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid references profiles(id) on delete cascade,
  recipient_id uuid references profiles(id) on delete cascade,
  ciphertext text not null,
  iv text not null,
  sent_at timestamp with time zone default now()
);

-- Encrypted Media
create table encrypted_media (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid references encrypted_messages(id) on delete cascade,
  storage_path text not null,
  mime_type text,
  thumbnail_ciphertext text,
  uploaded_at timestamp with time zone default now()
);

-- RLS
alter table profiles enable row level security;
alter table responses enable row level security;
alter table daily_syncs enable row level security;
alter table encrypted_messages enable row level security;
alter table encrypted_media enable row level security;

-- Policies
create policy "users own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "users see partner name only" on profiles for select using (partner_id = auth.uid() or id = auth.uid());
create policy "own responses" on responses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "couple sees sync" on daily_syncs for select using (
  couple_id = encode(digest(
    least((select partner_id::text from profiles where id = auth.uid()), auth.uid()::text) ||
    greatest((select partner_id::text from profiles where id = auth.uid()), auth.uid()::text),
    'sha256'
  ), 'hex')
);
create policy "own messages" on encrypted_messages for all using (sender_id = auth.uid() or recipient_id = auth.uid()) with check (sender_id = auth.uid());
create policy "own media" on encrypted_media for all using (
  exists (select 1 from encrypted_messages m where m.id = encrypted_media.message_id and (m.sender_id = auth.uid() or m.recipient_id = auth.uid()))
);

commit;
