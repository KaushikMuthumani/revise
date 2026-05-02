-- ============================================================
-- 003_cron_jobs.sql
-- Run AFTER 001 and 002 migrations in Supabase SQL Editor.
-- Requires pg_cron extension (enabled in 001).
-- ============================================================

-- Replace these placeholders below before running this migration:
--   https://your-backend.railway.app
--   your-strong-internal-secret-here

-- ── JOB 1: Increment missed_count for overdue topics (midnight UTC daily) ──
-- This replaces the job defined in 001 (if you used SELECT cron.schedule there,
-- it already exists; skip or drop+recreate as needed).

SELECT cron.unschedule('increment-missed-count') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'increment-missed-count'
);

SELECT cron.schedule(
  'increment-missed-count',
  '1 0 * * *',   -- 12:01 AM UTC every day
  $$
    UPDATE public.topics
    SET
      missed_count  = missed_count + 1,
      color_grade   = 'overdue'
    WHERE
      deleted_at IS NULL
      AND is_completed = false
      AND next_revision_due < CURRENT_DATE
      AND (
        last_revised_at IS NULL
        OR last_revised_at::date < next_revision_due
      );
  $$
);

-- ── JOB 2: Trigger notification send (every hour, backend filters by notification_time) ──
SELECT cron.unschedule('hourly-notifications') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'hourly-notifications'
);

SELECT cron.schedule(
  'hourly-notifications',
  '5 * * * *',   -- 5 minutes past every hour
  $$
    SELECT net.http_post(
      url     := 'https://your-backend.railway.app/internal/send-notifications',
      headers := jsonb_build_object('x-internal-secret', 'your-strong-internal-secret-here'),
      body    := '{}'::jsonb
    );
  $$
);

-- ── JOB 3: Weekly subscription expiry check ──
SELECT cron.schedule(
  'check-subscription-expiry',
  '0 2 * * 1',   -- Every Monday at 2 AM UTC
  $$
    UPDATE public.profiles
    SET is_premium = false
    WHERE
      is_premium = true
      AND premium_expires_at IS NOT NULL
      AND premium_expires_at < NOW();
  $$
);

-- ── Verify jobs ────────────────────────────────────────────
-- Run this to confirm all 3 jobs are scheduled:
-- SELECT jobname, schedule, command FROM cron.job ORDER BY jobid;
