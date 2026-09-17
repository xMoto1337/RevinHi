-- RevinHi Wallpapers marketplace schema. Run this once in the Supabase SQL editor for the
-- project referenced by SUPABASE_URL. Also create two Storage buckets (Storage -> New bucket):
--   - "wallpapers"           (the actual video/image files, keep private - served via signed/
--                              public URL from the API, not direct bucket access)
--   - "wallpaper-thumbnails" (small preview images, can be public)

create table if not exists wallpapers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null check (type in ('video', 'image')),
  storage_path text not null,       -- object key inside the "wallpapers" bucket
  thumbnail_path text,              -- object key inside "wallpaper-thumbnails", null until generated
  tags text[] not null default '{}',
  source text not null default 'upload' check (source in ('upload', 'pexels', 'pixabay')),
  source_attribution text,          -- e.g. "Video by Jane Doe on Pexels" - required for imported content
  uploader_email text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists wallpapers_status_idx on wallpapers (status, created_at desc);
