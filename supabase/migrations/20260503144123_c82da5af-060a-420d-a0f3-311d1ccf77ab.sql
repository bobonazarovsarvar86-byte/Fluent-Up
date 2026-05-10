
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own push subs select" ON public.push_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users own push subs insert" ON public.push_subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users own push subs delete" ON public.push_subscriptions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.daily_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  for_date date NOT NULL,
  level public.english_level NOT NULL,
  skill text NOT NULL CHECK (skill IN ('vocabulary','grammar','reading','listening','speaking','writing')),
  topic text NOT NULL,
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (for_date, level, skill)
);
ALTER TABLE public.daily_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily lessons readable" ON public.daily_lessons
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage daily lessons" ON public.daily_lessons
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS daily_lessons_date_level_idx ON public.daily_lessons (for_date, level);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_daily_reminder boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_streak_warn boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_new_lesson boolean NOT NULL DEFAULT true;
