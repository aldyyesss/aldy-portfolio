-- The backend alone accesses portfolio data with a server-only Supabase secret.
-- Public reads are served by Express. Browser JWTs cannot mutate this table directly.
begin;
create table if not exists public.portfolio_experiences (
  slug text primary key check (length(slug) <= 160 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(title) between 1 and 300),
  category text not null check (category in ('Organization','Event committee','Community service','Personal development')),
  period text not null check (length(period) between 1 and 300),
  start_date text not null check (start_date ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  organization text not null check (length(organization) between 1 and 300),
  description text not null check (length(description) between 1 and 10000),
  image_url text not null default '' check (image_url = '' or image_url ~ '^https://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists portfolio_experiences_start_date_idx
  on public.portfolio_experiences (start_date desc, slug asc);
alter table public.portfolio_experiences enable row level security;
revoke all on public.portfolio_experiences from public, anon, authenticated;
grant select, insert, update, delete on public.portfolio_experiences to service_role;
-- No anon/authenticated policies. All writes pass the backend admin email check.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('aldy-portfolio', 'aldy-portfolio', true, 4194304, array['image/webp','application/pdf'])
on conflict (id) do nothing;
-- Bucket is publicly readable. No public upload, update, or delete policies are created.
notify pgrst, 'reload schema';
commit;
