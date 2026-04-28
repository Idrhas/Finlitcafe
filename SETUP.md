# FinLit Café — Setup Guide

Follow these steps in order. Takes about 20 minutes total.

---

## Step 1 — Create a Supabase project (free)

1. Go to **https://supabase.com** and sign up (free)
2. Click **New Project**, give it a name like `finlitcafe`, choose a region close to you
3. Set a strong database password and save it somewhere safe
4. Wait ~2 minutes for the project to spin up

---

## Step 2 — Create the waitlist table

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Paste and run this SQL:

```sql
CREATE TABLE waitlist (
  id         BIGSERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  zip_code   TEXT NOT NULL,
  role       TEXT NOT NULL,
  topics     TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Allow the public (anonymous) to INSERT only
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert"
  ON waitlist FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only authenticated users (you) can SELECT
CREATE POLICY "Allow authenticated select"
  ON waitlist FOR SELECT
  TO authenticated
  USING (true);
```

3. Click **Run** — you should see "Success"

---

## Step 3 — Get your API keys

1. In Supabase, go to **Project Settings → API**
2. Copy:
   - **Project URL** (looks like `https://xyzabc.supabase.co`)
   - **anon / public key** (long string starting with `eyJ...`)

---

## Step 4 — Add your keys to the code

Open **`app.js`** and replace:
```js
const SUPABASE_URL      = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Open **`admin/admin.js`** and replace the same two values, plus:
```js
const ADMIN_PASSWORD = 'YOUR_ADMIN_PASSWORD';
```
Pick any password you want — this is what you'll type to log into the admin dashboard.

---

## Step 5 — Deploy to Vercel (free)

1. Push this folder to a **GitHub repository**
   - Go to https://github.com/new, create a repo
   - Upload the files (or use `git push`)

2. Go to **https://vercel.com**, sign up with GitHub

3. Click **Add New Project**, select your repo

4. Leave all settings as default, click **Deploy**

5. Vercel gives you a URL like `https://finlitcafe.vercel.app`

---

## Step 6 — Access your admin dashboard

Visit: `https://your-vercel-url.vercel.app/admin`

Enter the password you set in `admin.js`.

You'll see:
- Total signups, breakdown by role
- Searchable, sortable table of all entries
- Export to CSV button

---

## File structure

```
finlitcafe/
├── index.html        ← Landing page with waitlist form
├── style.css         ← All styles
├── app.js            ← Form logic + Supabase submission
├── vercel.json       ← Vercel routing config
├── admin/
│   ├── index.html    ← Admin dashboard
│   ├── admin.css     ← Admin styles
│   └── admin.js      ← Admin logic (load, filter, export)
└── SETUP.md          ← This file
```

---

## Viewing entries directly in Supabase

You can also view entries at any time by going to:
**Supabase → Table Editor → waitlist**

It looks like a spreadsheet. You can filter, sort, and export from there too.

