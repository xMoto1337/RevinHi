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

-- RevinHi Drivers' missing-driver report (/api/coverage): after a scan the app sends the chips no
-- source had any driver for, as bus + vendor + device numbers only ("pci:8086:02f0"). No install ID,
-- names or serial numbers, so a row can't be tied to a PC. The app sends each chip at most once a
-- month, so `reports` is roughly "PCs that needed it". Shown at /admin as "Missing coverage".
create table if not exists coverage_missing (
  product text not null,
  device text not null,
  reports integer not null default 1,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (product, device)
);
create index if not exists coverage_missing_reports on coverage_missing (product, reports desc);
alter table coverage_missing enable row level security;

create or replace function record_coverage(p_product text, p_devices text[])
returns void language sql as $$
  insert into coverage_missing (product, device)
  select p_product, d from unnest(p_devices) as d
  on conflict (product, device) do update
    set reports = coverage_missing.reports + 1,
        last_seen = now();
$$;
