-- ============================================================
-- 001_initial_schema.sql
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ── PROFILES ──────────────────────────────────────────────
CREATE TABLE public.profiles (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               text NOT NULL,
  display_name        text NOT NULL DEFAULT '',
  referral_code       text UNIQUE NOT NULL,
  referred_by         text,
  is_premium          boolean NOT NULL DEFAULT false,
  premium_expires_at  timestamptz,
  play_purchase_token text,
  streak_days         integer NOT NULL DEFAULT 0,
  last_revision_date  date,
  total_revisions     integer NOT NULL DEFAULT 0,
  notification_time   time NOT NULL DEFAULT '09:00:00',
  fcm_token           text,
  dark_mode           boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ── TOPICS ────────────────────────────────────────────────
CREATE TABLE public.topics (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title             text NOT NULL,
  subject_tag       text,
  note              text,
  image_url         text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  last_revised_at   timestamptz,
  revision_step     integer NOT NULL DEFAULT 0,
  next_revision_due date NOT NULL,
  is_completed      boolean NOT NULL DEFAULT false,
  missed_count      integer NOT NULL DEFAULT 0,
  color_grade       text NOT NULL DEFAULT 'new',
  custom_intervals  jsonb,
  is_vocab          boolean NOT NULL DEFAULT false,
  deleted_at        timestamptz,
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own topics"
  ON public.topics FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_topics_user_id ON public.topics(user_id);
CREATE INDEX idx_topics_next_due ON public.topics(next_revision_due) WHERE deleted_at IS NULL;
CREATE INDEX idx_topics_user_due ON public.topics(user_id, next_revision_due) WHERE deleted_at IS NULL;

-- ── REVISIONS ─────────────────────────────────────────────
CREATE TABLE public.revisions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id        uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  revised_at      timestamptz NOT NULL DEFAULT now(),
  step_completed  integer NOT NULL,
  was_missed      boolean NOT NULL DEFAULT false
);

ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own revisions"
  ON public.revisions FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_revisions_topic_id ON public.revisions(topic_id);
CREATE INDEX idx_revisions_user_id ON public.revisions(user_id);

-- ── VOCAB WORDS ───────────────────────────────────────────
CREATE TABLE public.vocab_words (
  id                integer PRIMARY KEY,
  word              text NOT NULL,
  definition        text NOT NULL,
  example_sentence  text,
  difficulty        text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard'))
);

-- vocab_words is readable by all authenticated users
ALTER TABLE public.vocab_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read vocab words"
  ON public.vocab_words FOR SELECT USING (true);

-- ── HANDLE NEW USER TRIGGER ───────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_referral_code text;
  v_referred_by   text;
BEGIN
  -- Generate unique 6-char alphanumeric referral code
  LOOP
    v_referral_code := upper(substring(md5(random()::text) from 1 for 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = v_referral_code);
  END LOOP;

  -- Extract referred_by from user metadata if provided
  v_referred_by := new.raw_user_meta_data->>'referred_by';

  INSERT INTO public.profiles (id, email, display_name, referral_code, referred_by)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', ''),
    v_referral_code,
    v_referred_by
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── UPDATED_AT TRIGGER ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_topics_updated_at
  BEFORE UPDATE ON public.topics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── COLOR GRADE UPDATE FUNCTION ───────────────────────────
CREATE OR REPLACE FUNCTION public.compute_color_grade(
  p_next_due    date,
  p_step        integer,
  p_completed   boolean
) RETURNS text AS $$
BEGIN
  IF p_completed THEN RETURN 'done'; END IF;
  IF p_step = 0 THEN RETURN 'new'; END IF;
  IF p_next_due < CURRENT_DATE THEN RETURN 'overdue'; END IF;
  IF p_next_due = CURRENT_DATE THEN RETURN 'due'; END IF;
  RETURN 'upcoming';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── MISSED COUNT CRON JOB ─────────────────────────────────
-- Run daily at midnight UTC to increment missed_count for overdue topics
SELECT cron.schedule(
  'increment-missed-count',
  '0 0 * * *',
  $$
  UPDATE public.topics
  SET
    missed_count = missed_count + 1,
    color_grade  = 'overdue'
  WHERE
    deleted_at IS NULL
    AND is_completed = false
    AND next_revision_due < CURRENT_DATE
    AND (last_revised_at::date != next_revision_due OR last_revised_at IS NULL);
  $$
);

-- ── NOTIFICATION CRON JOB ─────────────────────────────────
-- This calls the backend /internal/send-notifications endpoint
-- The backend handles per-user timing via profile.notification_time
SELECT cron.schedule(
  'daily-notifications',
  '0 * * * *',  -- every hour, backend filters by notification_time
  $$
  SELECT net.http_post(
    url := current_setting('app.backend_url') || '/internal/send-notifications',
    headers := jsonb_build_object('x-internal-secret', current_setting('app.internal_secret')),
    body := '{}'::jsonb
  );
  $$
);
