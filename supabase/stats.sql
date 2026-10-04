-- Download / install / sales stats for the RevinHi apps (shown at /admin/stats).
-- Run once in the Supabase SQL editor (same project as schema.sql).
-- Everything is written server-side with the service-role key, so RLS stays on with no policies.

-- One row per click on a download button (/api/download/<product>).
create table if not exists downloads (
  id bigserial primary key,
  product text not null,
  created_at timestamptz not null default now(),
  country text,
  referrer text
);
create index if not exists downloads_product_created on downloads (product, created_at desc);

-- One row per installed copy, keyed by a random ID the app makes on first run.
-- The app pings /api/ping at launch and every 12 hours; nothing personal is sent.
create table if not exists installs (
  install_id uuid primary key,
  product text not null,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  version text,
  tier text not null default 'free', -- 'free' | 'pro'
  pings integer not null default 1,
  country text
);
create index if not exists installs_product_last_seen on installs (product, last_seen desc);

-- One row per completed Gumroad sale (written by the Gumroad webhook).
create table if not exists sales (
  sale_id text primary key,
  product text not null,
  created_at timestamptz not null default now(),
  price_cents integer,
  refunded boolean not null default false
);

alter table downloads enable row level security;
alter table installs enable row level security;
alter table sales enable row level security;

-- Upsert used by /api/ping: insert a new install or bump an existing one.
create or replace function record_ping(p_install_id uuid, p_product text, p_version text, p_tier text, p_country text)
returns void language sql as $$
  insert into installs (install_id, product, version, tier, country)
  values (p_install_id, p_product, p_version, p_tier, p_country)
  on conflict (install_id) do update
    set last_seen = now(),
        version = excluded.version,
        tier = excluded.tier,
        country = coalesce(excluded.country, installs.country),
        pings = installs.pings + 1;
$$;
