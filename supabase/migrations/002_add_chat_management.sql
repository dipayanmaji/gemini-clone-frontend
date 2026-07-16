-- Run once in Supabase Dashboard → SQL Editor after 001_create_chats.sql.
alter table public.chats
  add column if not exists pinned boolean not null default false,
  add column if not exists archived boolean not null default false;

create index if not exists chats_user_pinned_updated_idx
  on public.chats (user_id, pinned desc, updated_at desc)
  where archived = false;
