-- First-touch campaign attribution on driver and rider signups.
--
-- Additive and nullable only. Existing inserts that do not mention these
-- columns keep working, including before this file is applied.
--
-- Do not run this against production from an agent or from CI. Review it,
-- then apply it once to CBL-Rides (project ref jgbaqzgkdqqvxmqytgsx).
-- The marketing site does not insert into public.drivers or public.riders.
-- Those writes live in the app at app.citybucketlist.com (DriverSignup and
-- MembershipForm). After this migration, that app can store the utm_* /
-- signup_referrer / signup_landing_path query params the marketing site
-- forwards. Until the app does that, these columns stay null.

alter table public.drivers
  add column if not exists signup_utm_source text,
  add column if not exists signup_utm_medium text,
  add column if not exists signup_utm_campaign text,
  add column if not exists signup_utm_content text,
  add column if not exists signup_utm_term text,
  add column if not exists signup_referrer text,
  add column if not exists signup_landing_path text;

alter table public.riders
  add column if not exists signup_utm_source text,
  add column if not exists signup_utm_medium text,
  add column if not exists signup_utm_campaign text,
  add column if not exists signup_utm_content text,
  add column if not exists signup_utm_term text,
  add column if not exists signup_referrer text,
  add column if not exists signup_landing_path text;

comment on column public.drivers.signup_utm_source is
  'First-touch utm_source from the marketing-site visit that led to this signup. Nullable.';
comment on column public.drivers.signup_utm_medium is
  'First-touch utm_medium from the marketing-site visit that led to this signup. Nullable.';
comment on column public.drivers.signup_utm_campaign is
  'First-touch utm_campaign from the marketing-site visit that led to this signup. Nullable.';
comment on column public.drivers.signup_utm_content is
  'First-touch utm_content from the marketing-site visit that led to this signup. Nullable.';
comment on column public.drivers.signup_utm_term is
  'First-touch utm_term from the marketing-site visit that led to this signup. Nullable.';
comment on column public.drivers.signup_referrer is
  'document.referrer captured on the first marketing-site landing. Nullable.';
comment on column public.drivers.signup_landing_path is
  'Path and query of the first marketing-site landing. Nullable.';

comment on column public.riders.signup_utm_source is
  'First-touch utm_source from the marketing-site visit that led to this signup. Nullable.';
comment on column public.riders.signup_utm_medium is
  'First-touch utm_medium from the marketing-site visit that led to this signup. Nullable.';
comment on column public.riders.signup_utm_campaign is
  'First-touch utm_campaign from the marketing-site visit that led to this signup. Nullable.';
comment on column public.riders.signup_utm_content is
  'First-touch utm_content from the marketing-site visit that led to this signup. Nullable.';
comment on column public.riders.signup_utm_term is
  'First-touch utm_term from the marketing-site visit that led to this signup. Nullable.';
comment on column public.riders.signup_referrer is
  'document.referrer captured on the first marketing-site landing. Nullable.';
comment on column public.riders.signup_landing_path is
  'Path and query of the first marketing-site landing. Nullable.';
