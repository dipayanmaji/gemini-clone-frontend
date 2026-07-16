-- Run this file once in the Supabase Dashboard: SQL Editor → New query.
-- It creates user-owned chats and messages with row-level security enabled.

create extension if not exists pgcrypto;

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New chat' check (char_length(title) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  role text not null check (role in ('user', 'model')),
  content text not null check (char_length(content) <= 12000),
  created_at timestamptz not null default now()
);

create index if not exists chats_user_updated_at_idx on public.chats (user_id, updated_at desc);
create index if not exists messages_chat_created_at_idx on public.messages (chat_id, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists chats_set_updated_at on public.chats;
create trigger chats_set_updated_at
before update on public.chats
for each row execute function public.set_updated_at();

alter table public.chats enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Users can manage their own chats" on public.chats;
create policy "Users can manage their own chats"
on public.chats
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage messages in their chats" on public.messages;
create policy "Users can manage messages in their chats"
on public.messages
for all
to authenticated
using (
  exists (
    select 1 from public.chats
    where chats.id = messages.chat_id and chats.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.chats
    where chats.id = messages.chat_id and chats.user_id = auth.uid()
  )
);
