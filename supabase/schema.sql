-- Run this once in Supabase Dashboard -> SQL Editor.
-- Creates the content table and storage buckets used by the wedding admin panel.
-- Run `npm run admin:setup` afterwards to create your admin login and buckets.

create extension if not exists "pgcrypto";

create table if not exists public.content_overrides (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.content_overrides enable row level security;

create policy "content readable by everyone"
  on public.content_overrides for select using (true);

create policy "content writeable by admin"
  on public.content_overrides for all
  to authenticated using (true) with check (true);

-- Storage buckets (publicly readable photos: couple portraits + gallery).
insert into storage.buckets (id, name, public) values ('couple', 'couple', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('gallery', 'gallery', true)
  on conflict (id) do nothing;

create policy "couple read public" on storage.objects for select
  using (bucket_id = 'couple');
create policy "couple write admin" on storage.objects for all
  to authenticated using (bucket_id = 'couple') with check (bucket_id = 'couple');
create policy "gallery read public" on storage.objects for select
  using (bucket_id = 'gallery');
create policy "gallery write admin" on storage.objects for all
  to authenticated using (bucket_id = 'gallery') with check (bucket_id = 'gallery');