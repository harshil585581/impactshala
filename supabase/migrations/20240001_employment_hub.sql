-- Employment Hub: Employer job postings table
CREATE TABLE IF NOT EXISTS employment_hub_postings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Step 1: Basic Details
  job_title            TEXT,
  org_name             TEXT,
  department           TEXT,
  industry             TEXT,
  job_type             TEXT,
  career_level         TEXT,
  work_mode            TEXT,

  -- Step 2: Role Clarity
  role_type            TEXT,
  reporting_to         TEXT,
  daily_tasks          TEXT,
  training_support     TEXT,
  growth_potential     TEXT,

  -- Step 3: Work Culture
  working_hours        TEXT,
  leave_policy         TEXT,
  company_culture      TEXT,
  diversity_practices  TEXT,

  -- Step 4: Compensation
  compensation         TEXT,
  payment_frequency    TEXT,
  additional_perks     TEXT,

  -- Step 5: Ideal Candidate
  mandatory_attributes TEXT,
  preferred_skillsets  TEXT,
  eligibility_criteria TEXT[]   DEFAULT '{}',
  required_documents   TEXT[]   DEFAULT '{}',

  -- Step 6: Commitment & Application
  weekly_hours         TEXT,
  last_date_to_apply   TEXT,
  end_time             TEXT,
  selection_process    TEXT,

  -- Step 7: Media & FAQs
  video_url            TEXT,
  faqs                 JSONB    DEFAULT '[]',

  -- Meta
  visibility           TEXT     NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'community')),
  status               TEXT     NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION _set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER employment_hub_postings_updated_at
  BEFORE UPDATE ON employment_hub_postings
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

-- RLS
ALTER TABLE employment_hub_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public postings visible to all authenticated users"
  ON employment_hub_postings FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Owner can insert their own posting"
  ON employment_hub_postings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update their own posting"
  ON employment_hub_postings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can delete their own posting"
  ON employment_hub_postings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for fast user-specific queries
CREATE INDEX IF NOT EXISTS idx_employment_hub_postings_user_id ON employment_hub_postings(user_id);
CREATE INDEX IF NOT EXISTS idx_employment_hub_postings_created_at ON employment_hub_postings(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Job Seeker profiles table (one active profile per user — upserted by user_id)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_seeker_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Step 1: Personal Information
  name                  TEXT,
  current_location      TEXT,
  job_industry          TEXT,
  looking_for_roles     TEXT,
  preferred_work_mode   TEXT,
  preferred_base_city   TEXT,
  current_status        TEXT,
  job_type              TEXT,

  -- Step 2: Desired Role & Work Preferences
  specific_jd           TEXT,
  reporting_comfort     TEXT,
  training_expectation  TEXT,
  work_hours_flexibility TEXT,
  leave_expectation     TEXT,

  -- Step 3: Compensation & Availability
  expected_salary       TEXT,
  open_to_negotiation   TEXT,
  department            TEXT,
  available_from        TEXT,
  weekly_commitment     TEXT,

  -- Step 4: Skills, Tools & Attributes
  technical_skills      TEXT[]  DEFAULT '{}',
  soft_skills           TEXT[]  DEFAULT '{}',
  certifications        TEXT[]  DEFAULT '{}',
  tools_platforms       TEXT,
  portfolio_link        TEXT,
  profile_link          TEXT,
  resume_url            TEXT,

  -- Step 5: Culture & Values Alignment
  preferred_work_culture TEXT,
  eligibility_criteria   TEXT[]  DEFAULT '{}',
  documents_required     TEXT[]  DEFAULT '{}',
  work_drives_you        TEXT,
  career_goals           TEXT,

  -- Step 6: Human Touch & Differentiators
  intro_video_url        TEXT,
  special_notes          TEXT,
  seeking_employer_who   TEXT,

  -- Meta
  visibility             TEXT    NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'community')),
  status                 TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER job_seeker_profiles_updated_at
  BEFORE UPDATE ON job_seeker_profiles
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

-- RLS
ALTER TABLE job_seeker_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active seeker profiles visible to all authenticated users"
  ON job_seeker_profiles FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Owner can insert their own profile"
  ON job_seeker_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update their own profile"
  ON job_seeker_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can delete their own profile"
  ON job_seeker_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_job_seeker_profiles_user_id ON job_seeker_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_job_seeker_profiles_created_at ON job_seeker_profiles(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Storage bucket for employment hub media (resumes, videos)
-- Run in Supabase dashboard → Storage → New bucket named: employment-hub-media
-- or via SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('employment-hub-media', 'employment-hub-media', true)
--   ON CONFLICT (id) DO NOTHING;
-- ─────────────────────────────────────────────────────────────────────────────
