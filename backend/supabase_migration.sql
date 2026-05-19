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
  title         TEXT,
  company       TEXT,
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

  -- Shared profile fields
  bio           TEXT,
  avatar_url    TEXT,
  cover_url     TEXT,
  location      TEXT,
  social_links  JSONB       NOT NULL DEFAULT '[]',
  reach_for     TEXT[]      NOT NULL DEFAULT '{}',
  setup_complete BOOLEAN    NOT NULL DEFAULT false,

  -- Individual profile fields
  role          TEXT,
  education_level TEXT,
  institute_name  TEXT,
  resume_url    TEXT,
  skills        TEXT[]      NOT NULL DEFAULT '{}',
  work_sector   TEXT,
  work_industry TEXT,
  teach_subject TEXT,
  experience_years TEXT,
  entrepreneur_type TEXT,
  describe_as   TEXT,
  languages     TEXT,

  -- Organization profile fields
  sector        TEXT        CHECK (sector IN ('government', 'private')),
  edu_levels_offered TEXT[] NOT NULL DEFAULT '{}',
  applicable_industries TEXT[] NOT NULL DEFAULT '{}',
  services      TEXT[]      NOT NULL DEFAULT '{}',
  industries    JSONB       NOT NULL DEFAULT '[]',

  agreed_terms  BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Migration: add profile columns to existing tables
-- (safe to re-run — uses IF NOT EXISTS / IF EXISTS guards)
-- ============================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS bio              TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url       TEXT,
  ADD COLUMN IF NOT EXISTS cover_url        TEXT,
  ADD COLUMN IF NOT EXISTS location         TEXT,
  ADD COLUMN IF NOT EXISTS social_links     JSONB       DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS reach_for        TEXT[]      DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS setup_complete   BOOLEAN     DEFAULT false,
  ADD COLUMN IF NOT EXISTS role             TEXT,
  ADD COLUMN IF NOT EXISTS education_level  TEXT,
  ADD COLUMN IF NOT EXISTS institute_name   TEXT,
  ADD COLUMN IF NOT EXISTS resume_url       TEXT,
  ADD COLUMN IF NOT EXISTS skills           TEXT[]      DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS work_sector      TEXT,
  ADD COLUMN IF NOT EXISTS work_industry    TEXT,
  ADD COLUMN IF NOT EXISTS teach_subject    TEXT,
  ADD COLUMN IF NOT EXISTS experience_years TEXT,
  ADD COLUMN IF NOT EXISTS entrepreneur_type TEXT,
  ADD COLUMN IF NOT EXISTS describe_as      TEXT,
  ADD COLUMN IF NOT EXISTS languages        TEXT,
  ADD COLUMN IF NOT EXISTS sector           TEXT        CHECK (sector IN ('government', 'private')),
  ADD COLUMN IF NOT EXISTS edu_levels_offered TEXT[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS applicable_industries TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS services         TEXT[]      DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS industries       JSONB       DEFAULT '[]';

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow backend (anon key) to insert profile right after auth.sign_up()
CREATE POLICY "anon_can_insert_profile" ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);


-- Allow all users to read any profile
CREATE POLICY "anyone_can_read_profiles" ON users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "user_can_update_own" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- Posts table
-- Also create a Storage bucket named "post-media" (public)
-- in the Supabase dashboard before running the storage policies.
-- ============================================================

CREATE TABLE IF NOT EXISTS posts (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_type         TEXT        NOT NULL CHECK (post_type IN ('photo', 'video', 'event', 'poll', 'question')),
  visibility        TEXT        NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'community')),

  -- Photo / Video
  content           TEXT,
  media_urls        TEXT[],

  -- Event
  cover_image_url   TEXT,
  event_type        TEXT        CHECK (event_type IN ('online', 'inperson')),
  event_title       TEXT,
  registration_link TEXT,
  event_location    TEXT,
  start_date        DATE,
  start_time        TIME,
  end_date          DATE,
  end_time          TIME,
  event_description TEXT,

  -- Poll
  poll_question     TEXT,
  poll_options      TEXT[],

  -- Question
  question_text     TEXT,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public posts readable by all"
  ON posts FOR SELECT
  USING (visibility = 'public' OR auth.uid() = user_id);

CREATE POLICY "Users insert own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- Storage policies for post-media bucket (run after creating the bucket)
CREATE POLICY "Authenticated users upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "post-media publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-media');

-- ============================================================
-- Experiences table
-- ============================================================

CREATE TABLE IF NOT EXISTS experiences (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role          TEXT        NOT NULL,
  company       TEXT        NOT NULL,
  emp_type      TEXT,
  start_month   TEXT,
  start_year    TEXT,
  end_month     TEXT,
  end_year      TEXT,
  is_current    BOOLEAN     NOT NULL DEFAULT false,
  location      TEXT,
  description   TEXT,
  skills        TEXT[],
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Experiences readable by all"
  ON experiences FOR SELECT
  USING (true);

CREATE POLICY "Users insert own experiences"
  ON experiences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own experiences"
  ON experiences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own experiences"
  ON experiences FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Personal Achievements table
-- ============================================================

CREATE TABLE IF NOT EXISTS personal_achievements (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  description   TEXT,
  achieved_date TEXT,
  media_urls    TEXT[],
  visibility    TEXT        NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'only_me', 'community')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE personal_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public achievements readable by all"
  ON personal_achievements FOR SELECT
  USING (visibility = 'public' OR auth.uid() = user_id);

CREATE POLICY "Users insert own achievements"
  ON personal_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own achievements"
  ON personal_achievements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own achievements"
  ON personal_achievements FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Collaborative Accomplishments table
-- ============================================================

CREATE TABLE IF NOT EXISTS collaborative_accomplishments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  collaborators   JSONB       NOT NULL DEFAULT '[]',
  description     TEXT,
  achieved_month  TEXT,
  achieved_year   TEXT,
  media_urls      TEXT[],
  visibility      TEXT        NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'only_me', 'community')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE collaborative_accomplishments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public collab accomplishments readable"
  ON collaborative_accomplishments FOR SELECT
  USING (visibility = 'public' OR auth.uid() = user_id);

CREATE POLICY "Users insert own collab accomplishments"
  ON collaborative_accomplishments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own collab accomplishments"
  ON collaborative_accomplishments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own collab accomplishments"
  ON collaborative_accomplishments FOR DELETE
  USING (auth.uid() = user_id);
