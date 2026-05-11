-- ============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Users table for both individual and organization signups
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type     TEXT        NOT NULL CHECK (user_type IN ('individual', 'organization')),
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,

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

-- Allow the backend (anon key) to insert new signups
CREATE POLICY "anon_can_signup" ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow the backend (anon key) to check for duplicate emails
CREATE POLICY "anon_can_check_email" ON users
  FOR SELECT
  TO anon
  USING (true);
