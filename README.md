# Project Database

Static app (index.html) + base catalog (data.json). Your annotations sync to a cloud store.

## Switch to Supabase (durable, free)
1. supabase.com → new project (free).
2. SQL Editor → paste & run `supabase.sql`.
3. Project Settings → API → copy the **Project URL** and **anon public** key.
4. In `index.html`, find `const SUPA={url:"YOUR_SUPABASE_URL", key:"YOUR_SUPABASE_ANON_KEY"};` and paste them.
5. Commit/deploy. The header shows ☁ Synced when it's talking to Supabase.
(Until filled, it uses the jsonblob fallback.)

## GitHub + auto-deploy
1. Create a repo, push this folder (index.html, data.json, supabase.sql, README.md).
2. Netlify → Add new project → Import from Git → pick the repo. Publish dir = repo root.
3. Every `git push` now auto-deploys. No more drag-drop.

Note: the anon key is public by design; fine given no-security. `Export all` = full backup anytime.
