-- Run this once in Supabase Dashboard -> SQL Editor after supabase/schema.sql.
-- Adds the wedding album tables, their RLS policies and the "albums" storage
-- bucket used by the album manager. Re-running is safe.

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  title jsonb not null default '{"en":"","ta":""}'::jsonb,
  slug text not null unique,
  subtitle jsonb not null default '{"en":"","ta":""}'::jsonb,
  description jsonb not null default '{"en":"","ta":""}'::jsonb,
  event_type text not null default 'custom'
    check (event_type in ('pre-wedding','engagement','mehendi','haldi','reception','wedding','post-wedding','custom')),
  event_date date,
  location text not null default '',
  cover_image text not null default '',
  layout_type text not null default 'cinematic-story'
    check (layout_type in ('cinematic-story','3d-photo-book','editorial-grid','masonry-gallery','horizontal-filmstrip','double-exposure-story')),
  theme text not null default 'royal-maroon-gold'
    check (theme in ('royal-maroon-gold','ivory-champagne','emerald-temple','rose-blush','midnight-luxury')),
  is_published boolean not null default false,
  allow_download boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.album_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  image_url text not null default '',
  thumbnail_url text not null default '',
  full_url text not null default '',
  public_id text not null default '',
  alt_text text not null default '',
  title jsonb not null default '{"en":"","ta":""}'::jsonb,
  caption jsonb not null default '{"en":"","ta":""}'::jsonb,
  story_text jsonb not null default '{"en":"","ta":""}'::jsonb,
  location text not null default '',
  taken_at date,
  sort_order integer not null default 0,
  orientation text not null default 'landscape'
    check (orientation in ('landscape','portrait','square')),
  featured boolean not null default false,
  is_published boolean not null default true,
  effect_type text not null default 'none'
    check (effect_type in ('none','cinematic','black-and-white','sepia-memory','gold-glow','soft-bloom','film-grain','parallax-depth','double-exposure','polaroid','vintage-film')),
  overlay_image_url text not null default '',
  effect_config jsonb not null default '{}'::jsonb,
  focal_point_x real not null default 50,
  focal_point_y real not null default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists albums_slug_idx on public.albums (slug);
create index if not exists albums_published_idx on public.albums (is_published, sort_order);
create index if not exists album_photos_album_idx on public.album_photos (album_id, sort_order);

alter table public.albums enable row level security;
alter table public.album_photos enable row level security;

-- Visitors read published albums only; signed-in admins manage everything.
create policy "albums published readable" on public.albums
  for select using (is_published = true);
create policy "albums admin full" on public.albums
  for all to authenticated using (true) with check (true);

create policy "album photos published album readable" on public.album_photos
  for select using (
    exists (select 1 from public.albums a where a.id = album_photos.album_id and a.is_published = true)
  );
create policy "album photos admin full" on public.album_photos
  for all to authenticated using (true) with check (true);

-- Publicly-readable album photo storage.
insert into storage.buckets (id, name, public) values ('albums', 'albums', true)
  on conflict (id) do nothing;

create policy "albums read public" on storage.objects for select
  using (bucket_id = 'albums');
create policy "albums write admin" on storage.objects for all
  to authenticated using (bucket_id = 'albums') with check (bucket_id = 'albums');