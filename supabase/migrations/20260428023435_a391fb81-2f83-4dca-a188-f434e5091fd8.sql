-- Add new CEFR levels to english_level enum
ALTER TYPE public.english_level ADD VALUE IF NOT EXISTS 'elementary';
ALTER TYPE public.english_level ADD VALUE IF NOT EXISTS 'upper-intermediate';
ALTER TYPE public.english_level ADD VALUE IF NOT EXISTS 'proficient';

-- Add new sections to lessons table
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS reading jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS listening jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS speaking jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Storage bucket for listening audio (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('listening_audio', 'listening_audio', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for listening audio
CREATE POLICY "Listening audio public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'listening_audio');

-- Admins can upload/manage listening audio
CREATE POLICY "Admins can upload listening audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listening_audio' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update listening audio"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'listening_audio' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete listening audio"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'listening_audio' AND public.has_role(auth.uid(), 'admin'));