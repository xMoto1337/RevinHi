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

-- RLS on, no policies defined - this app only ever talks to these tables via the service_role key
-- (see lib/supabase.ts's getSupabaseAdmin()), which bypasses RLS entirely, so this has no effect on
-- the app itself. It does stop the anon/authenticated keys (the public-safe ones, if this Supabase
-- project's anon key is ever used anywhere) from reading or writing these tables directly.
alter table wallpapers enable row level security;

-- BinScout "anywhere" phone relay. BinScout (a separate desktop app, not part of this site) polls
-- this table from wherever it's running; a phone visiting /binscout on this site drops a job in and
-- polls for the result. Nothing here is RevinHi-specific - this table only exists because
-- revinhi-website already has a Supabase project wired up, and BinScout's owner chose to reuse that
-- instead of standing up separate infrastructure. Rows are short-lived (see the poll route's
-- opportunistic cleanup) - this is a mailbox, not a permanent record.
create table if not exists binscout_jobs (
  id uuid primary key default gen_random_uuid(),
  device_token text not null,          -- the requesting BinScout install's own secret, doubles as the
                                        -- partition key so one phone can't see another install's jobs
  kind text not null check (kind in ('search', 'image_search')),
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'done')),
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists binscout_jobs_token_status_idx on binscout_jobs (device_token, status, created_at);

-- Same reasoning as wallpapers above: service_role (used by all app/api/binscout/* routes) bypasses
-- this; it only blocks direct anon/authenticated access.
alter table binscout_jobs enable row level security;
