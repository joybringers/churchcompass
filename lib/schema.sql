-- ChurchCompass database schema
-- Run this in your Supabase project: SQL Editor → New query → paste → Run

create extension if not exists "pgcrypto";

create table if not exists cc_churches (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  denomination  text,
  logo_url      text,
  primary_color text default '#1e3a5f',
  admin_email   text not null,
  password_hash text not null,
  address       text,
  phone         text,
  website       text,
  created_at    timestamptz default now()
);

create table if not exists cc_members (
  id          uuid primary key default gen_random_uuid(),
  church_id   uuid references cc_churches(id) on delete cascade,
  first_name  text not null,
  last_name   text not null,
  email       text,
  phone       text,
  dob         date,
  member_type text not null default 'adult',
  parent_id   uuid references cc_members(id),
  notes       text,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

create table if not exists cc_events (
  id          uuid primary key default gen_random_uuid(),
  church_id   uuid references cc_churches(id) on delete cascade,
  name        text not null,
  event_type  text default 'service',
  event_date  date not null,
  start_time  time,
  end_time    time,
  description text,
  created_at  timestamptz default now()
);

create table if not exists cc_attendance (
  id            uuid primary key default gen_random_uuid(),
  church_id     uuid references cc_churches(id) on delete cascade,
  event_id      uuid references cc_events(id),
  member_id     uuid references cc_members(id),
  visitor_name  text,
  visitor_type  text default 'member',
  sign_in_time  timestamptz default now(),
  sign_out_time timestamptz,
  signed_in_by  text,
  notes         text,
  created_at    timestamptz default now()
);

create table if not exists cc_first_timers (
  id                  uuid primary key default gen_random_uuid(),
  church_id           uuid references cc_churches(id) on delete cascade,
  first_name          text not null,
  last_name           text not null,
  email               text,
  phone               text,
  address             text,
  how_heard           text,
  prayer_request      text,
  would_like_contact  boolean default false,
  follow_up_status    text default 'pending',
  follow_up_notes     text,
  visited_date        date default current_date,
  created_at          timestamptz default now()
);

create table if not exists cc_custom_fields (
  id            uuid primary key default gen_random_uuid(),
  church_id     uuid references cc_churches(id) on delete cascade,
  form_type     text not null,
  field_name    text not null,
  field_label   text not null,
  field_type    text not null,
  field_options jsonb,
  is_required   boolean default false,
  position      int default 0,
  is_active     boolean default true,
  created_at    timestamptz default now()
);

create table if not exists cc_custom_field_values (
  id          uuid primary key default gen_random_uuid(),
  field_id    uuid references cc_custom_fields(id) on delete cascade,
  record_id   uuid not null,
  record_type text not null,
  value       text,
  created_at  timestamptz default now()
);

create index if not exists idx_cc_members_church        on cc_members(church_id);
create index if not exists idx_cc_events_church         on cc_events(church_id);
create index if not exists idx_cc_attendance_church     on cc_attendance(church_id);
create index if not exists idx_cc_attendance_event      on cc_attendance(event_id);
create index if not exists idx_cc_first_timers_church   on cc_first_timers(church_id);
create index if not exists idx_cc_custom_fields_church  on cc_custom_fields(church_id);
