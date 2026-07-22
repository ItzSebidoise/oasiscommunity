
-- 1. New roles
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'portal_owner';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'portal_leadership';

-- Commit enum additions so subsequent statements can reference them
COMMIT;
BEGIN;

-- 2. profiles: add description
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. news table
CREATE TABLE IF NOT EXISTS public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  cover_url TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- 4. vip_settings (single row)
CREATE TABLE IF NOT EXISTS public.vip_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  free_vip_ends_at TIMESTAMPTZ NOT NULL DEFAULT '2026-08-30 23:59:00+02',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vip_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.vip_settings TO authenticated;
GRANT ALL ON public.vip_settings TO service_role;
ALTER TABLE public.vip_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.vip_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 5. Fix is_staff — must check actual staff roles (not just any row)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN (
        'cs16_owner','cs16_leadership','cs16_admin',
        'ts3_owner','ts3_leadership','ts3_admin',
        'portal_owner','portal_leadership'
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_leadership(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('cs16_owner','cs16_leadership','ts3_owner','ts3_leadership','portal_owner','portal_leadership'));
$$;

-- Portal-only leadership check (for news + vip_settings)
CREATE OR REPLACE FUNCTION public.is_portal_leadership(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('portal_owner','portal_leadership','cs16_owner','ts3_owner'));
$$;

-- 6. Revoke public execute on security definer helpers, grant only to what's needed
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_leadership(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_portal_leadership(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_leadership(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_portal_leadership(uuid) TO authenticated;

-- 7. RLS policies for news
DROP POLICY IF EXISTS "news readable" ON public.news;
CREATE POLICY "news readable" ON public.news FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "news insert leadership" ON public.news;
CREATE POLICY "news insert leadership" ON public.news FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND public.is_portal_leadership(auth.uid()));
DROP POLICY IF EXISTS "news update leadership" ON public.news;
CREATE POLICY "news update leadership" ON public.news FOR UPDATE TO authenticated
  USING (public.is_portal_leadership(auth.uid()));
DROP POLICY IF EXISTS "news delete leadership" ON public.news;
CREATE POLICY "news delete leadership" ON public.news FOR DELETE TO authenticated
  USING (public.is_portal_leadership(auth.uid()));

-- 8. RLS policies for vip_settings
DROP POLICY IF EXISTS "vip readable" ON public.vip_settings;
CREATE POLICY "vip readable" ON public.vip_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "vip update leadership" ON public.vip_settings;
CREATE POLICY "vip update leadership" ON public.vip_settings FOR UPDATE TO authenticated
  USING (public.is_portal_leadership(auth.uid())) WITH CHECK (public.is_portal_leadership(auth.uid()));

-- 9. updated_at trigger for news + vip
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
REVOKE EXECUTE ON FUNCTION public.tg_touch_updated_at() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS news_touch ON public.news;
CREATE TRIGGER news_touch BEFORE UPDATE ON public.news
FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
DROP TRIGGER IF EXISTS vip_touch ON public.vip_settings;
CREATE TRIGGER vip_touch BEFORE UPDATE ON public.vip_settings
FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- 10. Storage policies
-- avatars: any authenticated user can manage files under their own folder {uid}/...
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars public read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "avatars user write" ON storage.objects;
CREATE POLICY "avatars user write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "avatars user update" ON storage.objects;
CREATE POLICY "avatars user update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "avatars user delete" ON storage.objects;
CREATE POLICY "avatars user delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
-- Leadership can update anyone's avatar (for admin panel)
DROP POLICY IF EXISTS "avatars leadership all" ON storage.objects;
CREATE POLICY "avatars leadership all" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'avatars' AND public.is_leadership(auth.uid()))
  WITH CHECK (bucket_id = 'avatars' AND public.is_leadership(auth.uid()));

-- news bucket: read for everyone, write for portal leadership
DROP POLICY IF EXISTS "news public read" ON storage.objects;
CREATE POLICY "news public read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'news');
DROP POLICY IF EXISTS "news leadership write" ON storage.objects;
CREATE POLICY "news leadership write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'news' AND public.is_portal_leadership(auth.uid()));
DROP POLICY IF EXISTS "news leadership update" ON storage.objects;
CREATE POLICY "news leadership update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'news' AND public.is_portal_leadership(auth.uid()));
DROP POLICY IF EXISTS "news leadership delete" ON storage.objects;
CREATE POLICY "news leadership delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'news' AND public.is_portal_leadership(auth.uid()));
