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
  org_name          TEXT,
  org_type          TEXT        CHECK (org_type IN (
                      'educational','forprofit','nonprofit','health',
                      'utilities','welfare','fieldtrip','startup',
                      'talent','safety','international','others'
                    )),
  year_of_founding  TEXT,
  website           TEXT,
  contact_name      TEXT,
  phone             TEXT,

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
  ADD COLUMN IF NOT EXISTS industries       JSONB       DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS year_of_founding TEXT;

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
-- Learning Courses table
-- ============================================================

CREATE TABLE IF NOT EXISTS learning_courses (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_level         TEXT        NOT NULL CHECK (program_level IN ('school', 'college', 'professional')),
  title                 TEXT        NOT NULL,
  course_mode           TEXT        NOT NULL CHECK (course_mode IN ('onsite', 'remote', 'hybrid')),
  venue                 TEXT,
  online_access         TEXT,
  visibility            TEXT        NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'community')),
  status                TEXT        NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),

  -- School-specific
  admission_for         TEXT[]      NOT NULL DEFAULT '{}',
  education_board       TEXT,
  board_affiliation     TEXT,
  grades_for            TEXT[]      NOT NULL DEFAULT '{}',

  -- College-specific
  academic_levels       TEXT[]      NOT NULL DEFAULT '{}',
  college_stream        TEXT,

  -- Professional-specific
  course_levels         TEXT[]      NOT NULL DEFAULT '{}',
  pro_stream            TEXT,

  -- Step-2 curriculum & details
  curriculum_features   JSONB       NOT NULL DEFAULT '{}',
  languages             TEXT[]      NOT NULL DEFAULT '{}',
  duration              TEXT,
  start_date            DATE,
  start_time            TEXT,
  end_date              DATE,
  end_time              TEXT,
  last_date_to_apply    DATE,
  certification         TEXT,
  other_benefits        TEXT,
  career_outcomes       TEXT,
  eligibility_criteria  TEXT[]      NOT NULL DEFAULT '{}',
  required_documents    TEXT[]      NOT NULL DEFAULT '{}',
  fee_type              TEXT        CHECK (fee_type IN ('range', 'fixed')),
  description           TEXT,
  thumbnail_url         TEXT,
  brochure_url          TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE learning_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published public courses readable by all"
  ON learning_courses FOR SELECT
  USING (
    (status = 'published' AND visibility = 'public')
    OR auth.uid() = user_id
  );

CREATE POLICY "Users insert own courses"
  ON learning_courses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own courses"
  ON learning_courses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own courses"
  ON learning_courses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Course Applications table
-- ============================================================

CREATE TABLE IF NOT EXISTS course_applications (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id         UUID        NOT NULL REFERENCES learning_courses(id) ON DELETE CASCADE,
  user_id           UUID        REFERENCES users(id) ON DELETE SET NULL,
  applicant_name    TEXT        NOT NULL,
  applicant_email   TEXT        NOT NULL,
  applicant_mobile  TEXT,
  message           TEXT,
  document_urls     TEXT[]      NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE course_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Course owners can read applications"
  ON course_applications FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (SELECT user_id FROM learning_courses WHERE id = course_id)
  );

CREATE POLICY "Anyone can submit an application"
  ON course_applications FOR INSERT
  WITH CHECK (true);

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

-- ============================================================
-- Discover Posts table
-- ============================================================

CREATE TABLE IF NOT EXISTS discover_posts (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_type              TEXT        NOT NULL CHECK (post_type IN ('provider', 'seeker')),
  visibility             TEXT        NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'community')),

  -- Common fields
  title                  TEXT        NOT NULL,
  domain                 TEXT,
  nature                 TEXT,
  keyword                TEXT,
  target_audience        TEXT,
  educational_level      TEXT,
  body                   TEXT,
  image_url              TEXT,

  -- Provider-specific
  event_occurrence       TEXT        CHECK (event_occurrence IN ('one_day', 'weekly', 'custom_multi_day')),
  event_date             DATE,
  start_time             TEXT,
  end_time               TEXT,
  delivery_mode          TEXT,
  address                TEXT,
  communication_language TEXT,
  level_of_participant   TEXT,
  eligibility_criteria   TEXT,
  last_date_to_apply     DATE,
  fee                    TEXT,
  onsite_venue           TEXT,
  online_access          TEXT,
  weekly_slots           JSONB       NOT NULL DEFAULT '[]',

  -- Seeker-specific
  professional_level     TEXT,
  can_pay                BOOLEAN,
  budget                 TEXT,
  provider_preferences   TEXT,
  preferred_date         DATE,

  -- Stats
  reactions_count        INT         NOT NULL DEFAULT 0,
  comments_count         INT         NOT NULL DEFAULT 0,

  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE discover_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public discover posts readable by all"
  ON discover_posts FOR SELECT
  USING (visibility = 'public' OR auth.uid() = user_id);

-- Allow any role to insert discover posts (backend handles authorization)
CREATE POLICY "allow_insert_discover_posts"
  ON discover_posts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users update own discover posts"
  ON discover_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own discover posts"
  ON discover_posts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Discover Bookmarks table
-- ============================================================

CREATE TABLE IF NOT EXISTS discover_bookmarks (
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id    UUID        NOT NULL REFERENCES discover_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

ALTER TABLE discover_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own bookmarks"
  ON discover_bookmarks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Discover Applications table
-- ============================================================

CREATE TABLE IF NOT EXISTS discover_applications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID        NOT NULL REFERENCES discover_posts(id) ON DELETE CASCADE,
  user_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  phone      TEXT,
  status     TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE discover_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post owner can read applications"
  ON discover_applications FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT user_id FROM discover_posts WHERE id = post_id
    )
  );

CREATE POLICY "Anyone can submit application"
  ON discover_applications FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- Community Connections table
-- Tracks connection requests and accepted friendships between users
-- ============================================================

CREATE TABLE IF NOT EXISTS community_connections (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (requester_id, addressee_id)
);

ALTER TABLE community_connections ENABLE ROW LEVEL SECURITY;

-- Users can see connections where they are either requester or addressee
CREATE POLICY "Users can view their own connections"
  ON community_connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can send connection requests (insert as requester)
CREATE POLICY "Users can send connection requests"
  ON community_connections FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Addressee can accept/reject; requester can cancel their own pending request
CREATE POLICY "Users can update their connections"
  ON community_connections FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Either party can remove a connection
CREATE POLICY "Users can remove their connections"
  ON community_connections FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- ============================================================
-- Direct Messaging: conversations + messages
-- ============================================================

CREATE TABLE IF NOT EXISTS conversations (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_2 UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message  TEXT,
  last_message_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure one conversation per pair regardless of order
CREATE UNIQUE INDEX IF NOT EXISTS conversations_pair_unique
  ON conversations (LEAST(participant_1::text, participant_2::text), GREATEST(participant_1::text, participant_2::text));

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Participants can update their conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);


CREATE TABLE IF NOT EXISTS direct_messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT,
  message_type    TEXT        NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'audio')),
  file_url        TEXT,
  file_name       TEXT,
  reply_to_id     UUID        REFERENCES direct_messages(id) ON DELETE SET NULL,
  is_edited       BOOLEAN     NOT NULL DEFAULT false,
  is_deleted      BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation participants can read messages"
  ON direct_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
    )
  );

CREATE POLICY "Sender can insert messages"
  ON direct_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND conversation_id IN (
      SELECT id FROM conversations
      WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
    )
  );

CREATE POLICY "Sender can update own messages"
  ON direct_messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- Enable Realtime on direct_messages (INSERT + UPDATE) so the frontend can subscribe
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;

-- Allow full row replica identity so UPDATE payloads carry the full new row
ALTER TABLE direct_messages REPLICA IDENTITY FULL;
-- Saved Posts tables
-- ============================================================

-- Saves from the home feed (community posts)
CREATE TABLE IF NOT EXISTS saved_community_posts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id    UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  saved_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, post_id)
);

ALTER TABLE saved_community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved_community_posts"
  ON saved_community_posts FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);

-- Saves from the Discover feed
-- (stores a JSON snapshot because Discover items come from an external REST API)
CREATE TABLE IF NOT EXISTS saved_discover_items (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id    TEXT        NOT NULL,
  item_data  JSONB       NOT NULL,
  saved_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, item_id)
);

ALTER TABLE saved_discover_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved_discover_items"
  ON saved_discover_items FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);
