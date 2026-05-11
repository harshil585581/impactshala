-- ============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Users profile table linked to Supabase Auth (auth.users)
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type     TEXT        NOT NULL CHECK (user_type IN ('individual', 'organization')),
  email         TEXT        NOT NULL UNIQUE,

  -- Individual-only fields
  first_name    TEXT,
  last_name     TEXT,
  dob           DATE,
  interests     TEXT,

  -- Organization-only fields
  org_name      TEXT,
  org_type      TEXT        CHECK (org_type IN (
                  'educational','forprofit','nonprofit','health',
                  'utilities','welfare','fieldtrip','startup',
                  'talent','safety','international','others'
                )),
  website       TEXT,
  contact_name  TEXT,
  phone         TEXT,

  agreed_terms  BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow backend (anon key) to insert profile right after auth.sign_up()
CREATE POLICY "anon_can_insert_profile" ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow backend (anon key) to read profile for login response
CREATE POLICY "anon_can_read_profile" ON users
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users to read and update their own profile
CREATE POLICY "user_can_read_own" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "user_can_update_own" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
