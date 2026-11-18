-- School Mental Health Leadership Workshop — secure starter schema
-- Run in Supabase SQL Editor. Moderator room creation and control use Edge Functions.
create extension if not exists pgcrypto;

create table if not exists public.workshop_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  title text not null,
  active_question integer not null default 0 check (active_question between 0 and 13),
  status text not null default 'lobby' check (status in ('lobby','live','finished')),
  created_at timestamptz not null default now()
);

-- Private table: never expose moderator PIN hashes to browser clients.
create table if not exists public.workshop_moderators (
  room_id uuid primary key references public.workshop_rooms(id) on delete cascade,
  pin_hash text not null
);

create table if not exists public.workshop_responses (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.workshop_rooms(id) on delete cascade,
  question_id integer not null check (question_id between 1 and 12),
  choice text not null check (choice in ('A','B','C','D')),
  participant_token uuid not null,
  created_at timestamptz not null default now(),
  unique(room_id, question_id, choice, participant_token)
);

create index if not exists workshop_responses_room_question_idx
  on public.workshop_responses(room_id, question_id);

alter table public.workshop_rooms enable row level security;
alter table public.workshop_moderators enable row level security;
alter table public.workshop_responses enable row level security;

-- Participants can read room state, but cannot create or change rooms directly.
drop policy if exists "rooms are readable for joining" on public.workshop_rooms;
create policy "rooms are readable for joining"
on public.workshop_rooms for select to anon, authenticated using (true);

-- Moderator credentials are inaccessible to browser roles.
revoke all on public.workshop_moderators from anon, authenticated;

-- Anonymous participants can submit only for the currently released question.
drop policy if exists "anonymous participants can submit responses" on public.workshop_responses;
create policy "anonymous participants can submit responses"
on public.workshop_responses for insert to anon, authenticated
with check (
  exists (
    select 1 from public.workshop_rooms r
    where r.id = room_id and r.status = 'live' and r.active_question = question_id
  )
);

-- Prototype dashboard reads answer rows to calculate live distributions.
drop policy if exists "responses readable for live results" on public.workshop_responses;
create policy "responses readable for live results"
on public.workshop_responses for select to anon, authenticated using (true);

do $$ begin
  alter publication supabase_realtime add table public.workshop_rooms;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.workshop_responses;
exception when duplicate_object then null; when undefined_object then null; end $$;
