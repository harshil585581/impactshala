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
  venue_types   TEXT[]      NOT NULL DEFAULT '{}',
  department_type TEXT,
  talent_types  TEXT[]      NOT NULL DEFAULT '{}',
  support_types TEXT[]      NOT NULL DEFAULT '{}',

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
  ADD COLUMN IF NOT EXISTS venue_types      TEXT[]      DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS department_type  TEXT,
  ADD COLUMN IF NOT EXISTS talent_types     TEXT[]      DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS support_types    TEXT[]      DEFAULT '{}',
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
  status            TEXT        NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'not_a_fit', 'maybe', 'goodfit')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE course_applications ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'not_a_fit', 'maybe', 'goodfit'));

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
  eligibility_criteria   TEXT[]      NOT NULL DEFAULT '{}',
  documents_required     TEXT[]      NOT NULL DEFAULT '{}',
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

-- ============================================================
-- Post Likes table
-- ============================================================

CREATE TABLE IF NOT EXISTS post_likes (
  post_id    UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can see likes"
  ON post_likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own"
  ON post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Post Comments table
-- Handles comments for both home-feed posts (post_table='posts')
-- and discover posts (post_table='discover_posts').
-- post_id is a soft reference (no FK) so both tables can share it.
-- ============================================================

CREATE TABLE IF NOT EXISTS post_comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID        NOT NULL,
  post_table TEXT        NOT NULL DEFAULT 'posts' CHECK (post_table IN ('posts', 'discover_posts')),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL CHECK (char_length(content) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS post_comments_post_idx ON post_comments (post_id, post_table, created_at DESC);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments on public posts"
  ON post_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON post_comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Poll Votes table
-- One row per (post, user) — user can only vote once per poll.
-- ============================================================

CREATE TABLE IF NOT EXISTS poll_votes (
  post_id      UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  option_index INTEGER     NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read poll votes"
  ON poll_votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote"
  ON poll_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vote"
  ON poll_votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vote"
  ON poll_votes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Saved Learning Courses table
-- Stores a JSON snapshot (same pattern as saved_discover_items)
-- so courses can be displayed even if the API record changes.
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_learning_courses (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id  TEXT        NOT NULL,
  course_data JSONB      NOT NULL,
  saved_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);

ALTER TABLE saved_learning_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved_learning_courses"
  ON saved_learning_courses FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);

-- ============================================================
-- Saved Employment Postings table
-- References employment_hub_postings so full data is fetched
-- live rather than snapshotted.
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_employment_postings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  posting_id  UUID        NOT NULL REFERENCES employment_hub_postings(id) ON DELETE CASCADE,
  saved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, posting_id)
);

ALTER TABLE saved_employment_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved_employment_postings"
  ON saved_employment_postings FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);

-- ============================================================
-- Employment Applications table
-- ============================================================

CREATE TABLE IF NOT EXISTS employment_applications (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_id    UUID        NOT NULL REFERENCES employment_hub_postings(id) ON DELETE CASCADE,
  applicant_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  mobile        TEXT,
  message       TEXT,
  document_data JSONB       NOT NULL DEFAULT '[]'::jsonb,
  status        TEXT        NOT NULL DEFAULT 'applied'
                  CHECK (status IN ('applied', 'not_a_fit', 'maybe', 'goodfit')),
  applied_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (posting_id, applicant_id)
);
ALTER TABLE employment_applications ADD COLUMN IF NOT EXISTS document_data JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE employment_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants can submit their own applications"
  ON employment_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Applicants can view their own applications"
  ON employment_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = applicant_id);

CREATE POLICY "Posting owners can view all applications"
  ON employment_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employment_hub_postings
      WHERE id = posting_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Posting owners can update application status"
  ON employment_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employment_hub_postings
      WHERE id = posting_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employment_hub_postings
      WHERE id = posting_id AND user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_employment_applications_posting_id ON employment_applications(posting_id);
CREATE INDEX IF NOT EXISTS idx_employment_applications_applicant_id ON employment_applications(applicant_id);

-- ─── Notifications ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'system'
                CHECK (type IN ('message','job_alert','employment','application','payment','course','system')),
  is_read     BOOLEAN     NOT NULL DEFAULT false,
  action_url  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id        ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread    ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at     ON notifications(created_at DESC);

-- ─── Notification Triggers ────────────────────────────────────────────────────
-- SECURITY DEFINER so triggers can INSERT notifications for any user_id
-- regardless of RLS (trigger runs as postgres superuser in Supabase).

-- Trigger 1: Notify employer when a new application is submitted
CREATE OR REPLACE FUNCTION fn_notify_employer_on_application()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql AS $$
DECLARE
  v_employer_id UUID;
  v_job_title   TEXT;
BEGIN
  SELECT user_id, job_title
    INTO v_employer_id, v_job_title
    FROM employment_hub_postings
   WHERE id = NEW.posting_id;

  IF v_employer_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (
      v_employer_id,
      'New Application Received',
      NEW.name || ' applied for "' || v_job_title || '"',
      'application',
      '/applications/detail/' || NEW.posting_id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_employer_on_application ON employment_applications;
CREATE TRIGGER trg_notify_employer_on_application
  AFTER INSERT ON employment_applications
  FOR EACH ROW EXECUTE FUNCTION fn_notify_employer_on_application();

-- Trigger 2: Notify applicant when their application status changes
CREATE OR REPLACE FUNCTION fn_notify_applicant_on_status_change()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql AS $$
DECLARE
  v_job_title    TEXT;
  v_status_label TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT job_title INTO v_job_title
    FROM employment_hub_postings
   WHERE id = NEW.posting_id;

  v_status_label := CASE NEW.status
    WHEN 'goodfit'   THEN 'accepted for'
    WHEN 'not_a_fit' THEN 'not selected for'
    WHEN 'maybe'     THEN 'placed on hold for'
    ELSE 'updated for'
  END;

  INSERT INTO notifications (user_id, title, message, type, action_url)
  VALUES (
    NEW.applicant_id,
    'Application Status Updated',
    'Your application was ' || v_status_label || ' "' || v_job_title || '"',
    'application',
    '/applications'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_applicant_on_status_change ON employment_applications;
CREATE TRIGGER trg_notify_applicant_on_status_change
  AFTER UPDATE OF status ON employment_applications
  FOR EACH ROW EXECUTE FUNCTION fn_notify_applicant_on_status_change();

-- ─── Help Center Inquiries ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS help_center_inquiries (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        REFERENCES users(id) ON DELETE SET NULL,
  category           TEXT        NOT NULL,
  urgency            TEXT,
  timeline           DATE,
  requirements       TEXT,
  budget             TEXT,
  name               TEXT        NOT NULL,
  email              TEXT        NOT NULL,
  phone              TEXT,
  best_time          TEXT,
  contact_method     TEXT        NOT NULL DEFAULT 'email',
  additional_details TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE help_center_inquiries ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_notify_on_comment ON post_comments;
CREATE TRIGGER trg_notify_on_comment
  AFTER INSERT ON post_comments
  FOR EACH ROW EXECUTE FUNCTION fn_notify_on_comment();


-- ============================================================
-- Migrate eligibility_criteria to TEXT[] and add documents_required
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Step 1: add a temp array column
ALTER TABLE discover_posts
  ADD COLUMN IF NOT EXISTS eligibility_criteria_arr TEXT[] NOT NULL DEFAULT '{}';

-- Step 2: copy existing text values into the new array column
UPDATE discover_posts
SET eligibility_criteria_arr =
  CASE
    WHEN eligibility_criteria IS NULL OR eligibility_criteria = ''
    THEN '{}'::TEXT[]
    ELSE ARRAY[eligibility_criteria]
  END;

-- Step 3: drop the old TEXT column and rename the new one
ALTER TABLE discover_posts DROP COLUMN IF EXISTS eligibility_criteria;
ALTER TABLE discover_posts RENAME COLUMN eligibility_criteria_arr TO eligibility_criteria;

-- Step 4: add documents_required column
ALTER TABLE discover_posts
  ADD COLUMN IF NOT EXISTS documents_required TEXT[] NOT NULL DEFAULT '{}';


-- ============================================================
-- Update discover_applications status values for Discover My Postings
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE discover_applications DROP CONSTRAINT IF EXISTS discover_applications_status_check;
UPDATE discover_applications SET status = 'applied' WHERE status IN ('pending', 'reviewed', 'accepted', 'rejected');
ALTER TABLE discover_applications ALTER COLUMN status SET DEFAULT 'applied';
ALTER TABLE discover_applications ADD CONSTRAINT discover_applications_status_check
  CHECK (status IN ('applied', 'not_a_fit', 'maybe', 'goodfit'));


-- ============================================================
-- Add document_data and message to discover_applications
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE discover_applications ADD COLUMN IF NOT EXISTS message TEXT DEFAULT '';
ALTER TABLE discover_applications ADD COLUMN IF NOT EXISTS document_data JSONB DEFAULT '[]'::jsonb;
CREATE POLICY "Authenticated users can submit inquiries"
  ON help_center_inquiries FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- Discover reactions table (for like toggle)
-- ============================================================

CREATE TABLE IF NOT EXISTS discover_reactions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID        NOT NULL REFERENCES discover_posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE discover_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reactions"
  ON discover_reactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- Fix help_center_inquiries RLS to allow anyone to submit
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can submit inquiries" ON help_center_inquiries;

CREATE POLICY "Anyone can submit inquiry"
  ON help_center_inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Users can view own inquiries"
  ON help_center_inquiries FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- Nested comments (replies) — add parent_id to post_comments
-- ============================================================

ALTER TABLE post_comments
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON post_comments(parent_id);

-- ============================================================
-- Comment Likes table
-- ============================================================

CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id UUID        NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read likes (required for like counts)
CREATE POLICY "Authenticated users can read comment likes"
  ON comment_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can like comments"
  ON comment_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike own likes"
  ON comment_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- Fix notifications RLS — allow any authenticated user to send
-- a notification to another user (e.g., "X liked your comment")
-- ============================================================

DROP POLICY IF EXISTS "Users manage own notifications" ON notifications;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can send notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- Add deactivated_at column to users table for account deactivation
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ DEFAULT NULL;
-- User Follows
-- ============================================================
CREATE TABLE IF NOT EXISTS user_follows (
  follower_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS user_follows_follower_idx  ON user_follows (follower_id);
CREATE INDEX IF NOT EXISTS user_follows_following_idx ON user_follows (following_id);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own follows"
  ON user_follows FOR ALL
  TO authenticated
  USING (auth.uid() = follower_id)
  WITH CHECK (auth.uid() = follower_id);

-- ============================================================
-- Group Chats
-- ============================================================
CREATE TABLE IF NOT EXISTS group_chats (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  avatar_color TEXT        NOT NULL DEFAULT '#f77f00',
  created_by   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id  UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','moderator','member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     UUID        NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  sender_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content      TEXT,
  message_type TEXT        NOT NULL DEFAULT 'text' CHECK (message_type IN ('text','image','file','audio')),
  file_url     TEXT,
  file_name    TEXT,
  reply_to_id  UUID        REFERENCES group_messages(id) ON DELETE SET NULL,
  is_edited    BOOLEAN     NOT NULL DEFAULT false,
  is_deleted   BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS group_members_user_idx    ON group_members (user_id);
CREATE INDEX IF NOT EXISTS group_messages_group_idx  ON group_messages (group_id, created_at);

ALTER TABLE group_chats    ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- group_chats: visible to members; created by authenticated users
CREATE POLICY "Members can view group chats"
  ON group_chats FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM group_members WHERE group_id = id AND user_id = auth.uid()));

CREATE POLICY "Authenticated users can create groups"
  ON group_chats FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- group_members
CREATE POLICY "Members can view member list"
  ON group_members FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid()));

CREATE POLICY "Owners/admins can add members"
  ON group_members FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM group_members WHERE group_id = group_members.group_id AND user_id = auth.uid() AND role IN ('owner','admin'))
  );

CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- group_messages
CREATE POLICY "Members can read messages"
  ON group_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid()));

CREATE POLICY "Members can send messages"
  ON group_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (SELECT 1 FROM group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid())
  );

CREATE POLICY "Senders can edit/delete their messages"
  ON group_messages FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id);

-- ============================================================
-- Deleted accounts log (admin Account Attribution view)
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS deleted_accounts_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL,
  first_name  TEXT,
  last_name   TEXT,
  org_name    TEXT,
  email       TEXT,
  user_type   TEXT,
  role        TEXT,
  org_type    TEXT,
  avatar_url  TEXT,
  deleted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE deleted_accounts_log ENABLE ROW LEVEL SECURITY;

-- Service role (supabase_admin) bypasses RLS — no policy needed for backend.
-- Prevent any non-service client from reading this sensitive log.
CREATE POLICY "No direct client access"
  ON deleted_accounts_log FOR ALL
  USING (false);

-- ============================================================
-- Add status column to help_center_inquiries (admin workflow)
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE help_center_inquiries
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open'
  CHECK (status IN ('open', 'closed', 'cancelled'));

-- Allow admin (service role) to update status — no extra policy needed
-- since supabase_admin bypasses RLS. Add this policy so the column
-- is also visible to authenticated users viewing their own inquiries.
CREATE POLICY IF NOT EXISTS "Admin can manage inquiries"
  ON help_center_inquiries FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Call recordings: store the uploaded recording URL for a call
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE call_logs
  ADD COLUMN IF NOT EXISTS recording_url TEXT;
