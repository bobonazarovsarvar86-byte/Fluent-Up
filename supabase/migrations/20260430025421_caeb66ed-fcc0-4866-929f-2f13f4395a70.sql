-- Add subscription plan to profiles
DO $$ BEGIN
  CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro', 'premium');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan public.subscription_plan NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS daily_lessons_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_lessons_date date;

-- Helper function to check & increment daily lesson usage for free users
CREATE OR REPLACE FUNCTION public.can_start_lesson(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _plan public.subscription_plan;
  _count integer;
  _date date;
  _limit integer := 3;
BEGIN
  SELECT plan, daily_lessons_count, daily_lessons_date
    INTO _plan, _count, _date
    FROM public.profiles WHERE id = _user_id;

  IF _plan IN ('pro','premium') THEN
    RETURN jsonb_build_object('allowed', true, 'remaining', -1, 'plan', _plan);
  END IF;

  IF _date IS DISTINCT FROM CURRENT_DATE THEN
    _count := 0;
  END IF;

  IF _count >= _limit THEN
    RETURN jsonb_build_object('allowed', false, 'remaining', 0, 'plan', _plan, 'limit', _limit);
  END IF;

  RETURN jsonb_build_object('allowed', true, 'remaining', _limit - _count, 'plan', _plan, 'limit', _limit);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_lesson_start(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET daily_lessons_count = CASE
        WHEN daily_lessons_date IS DISTINCT FROM CURRENT_DATE THEN 1
        ELSE daily_lessons_count + 1
      END,
      daily_lessons_date = CURRENT_DATE
  WHERE id = _user_id;
END;
$$;