-- Run this in Supabase → SQL Editor (one time).
create table if not exists overlay (
  id text primary key,
  data jsonb not null default '{}'::jsonb
);
alter table overlay enable row level security;
-- No-auth access (you said security isn't a concern yet). Anyone with the anon key can read/write.
create policy "anon read"  on overlay for select to anon using (true);
create policy "anon write" on overlay for insert to anon with check (true);
create policy "anon update" on overlay for update to anon using (true) with check (true);
insert into overlay (id, data) values ('main', '{"ann":{},"ed":{},"add":[],"del":[]}')
  on conflict (id) do nothing;

-- === IMAGE STORAGE ===
-- Create the 'images' bucket if you didn't do it via the UI
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Allow public uploads to the 'images' bucket
create policy "Public Uploads"
on storage.objects for insert
to public
with check ( bucket_id = 'images' );
