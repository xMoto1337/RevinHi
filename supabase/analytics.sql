-- Website analytics for /admin (page views, visitors, sources, click events).
-- Run once in the Supabase SQL editor, after stats.sql.
-- Privacy: no cookies, no IP addresses stored. `visitor` is a hash of IP + browser + the date + a
-- server secret, so the same person counts once per day and can't be tracked across days.

create table if not exists pageviews (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  path text not null,
  referrer_host text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  country text,
  device text,   -- 'mobile' | 'tablet' | 'desktop'
  browser text,
  os text,
  visitor text not null
);
create index if not exists pageviews_created on pageviews (created_at desc);

-- Clicks that matter: 'download_click', 'buy_click' (Gumroad checkout opened), 'outbound'.
create table if not exists site_events (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  name text not null,
  path text,
  label text,
  visitor text not null
);
create index if not exists site_events_created on site_events (created_at desc);

alter table pageviews enable row level security;
alter table site_events enable row level security;
