
CREATE TABLE public.writing_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exercise_type text NOT NULL DEFAULT 'sentence',
  level public.english_level NOT NULL DEFAULT 'beginner',
  prompt text,
  text text NOT NULL,
  corrected_text text,
  grammar_score integer NOT NULL DEFAULT 0,
  vocabulary_score integer NOT NULL DEFAULT 0,
  fluency_score integer NOT NULL DEFAULT 0,
  overall_score integer NOT NULL DEFAULT 0,
  ielts_band numeric(3,1),
  mistakes jsonb NOT NULL DEFAULT '[]'::jsonb,
  suggestions jsonb NOT NULL DEFAULT '[]'::jsonb,
  feedback text,
  xp_earned integer NOT NULL DEFAULT 0,
  word_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.writing_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own writing" ON public.writing_submissions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));

CREATE POLICY "users insert own writing" ON public.writing_submissions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own writing" ON public.writing_submissions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_writing_submissions_updated
  BEFORE UPDATE ON public.writing_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_writing_user_created ON public.writing_submissions(user_id, created_at DESC);

-- Add daily writing counter to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_writing_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_writing_date date;

-- Quota helper
CREATE OR REPLACE FUNCTION public.can_submit_writing(_user_id uuid)
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
  SELECT plan, daily_writing_count, daily_writing_date
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

CREATE OR REPLACE FUNCTION public.record_writing_submission(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET daily_writing_count = CASE
        WHEN daily_writing_date IS DISTINCT FROM CURRENT_DATE THEN 1
        ELSE daily_writing_count + 1
      END,
      daily_writing_date = CURRENT_DATE
  WHERE id = _user_id;
END;
$$;
