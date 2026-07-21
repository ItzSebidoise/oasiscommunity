
-- Enum for roles
CREATE TYPE public.app_role AS ENUM (
  'cs16_owner','cs16_leadership','cs16_admin',
  'ts3_owner','ts3_leadership','ts3_admin'
);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nick TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "user updates own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO anon;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles readable by all" ON public.user_roles FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_leadership(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('cs16_owner','cs16_leadership','ts3_owner','ts3_leadership'));
$$;

-- Forum categories
CREATE TABLE public.forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  allow_topics BOOLEAN NOT NULL DEFAULT true
);
GRANT SELECT ON public.forum_categories TO anon, authenticated;
GRANT ALL ON public.forum_categories TO service_role;
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories readable" ON public.forum_categories FOR SELECT USING (true);

-- Topics
CREATE TABLE public.forum_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_template BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.forum_topics TO anon, authenticated;
GRANT INSERT, UPDATE ON public.forum_topics TO authenticated;
GRANT ALL ON public.forum_topics TO service_role;
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "topics readable" ON public.forum_topics FOR SELECT USING (true);
CREATE POLICY "auth creates own topic" ON public.forum_topics FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND (
      -- non-template: only in categories that allow topics
      (is_template = false AND EXISTS (SELECT 1 FROM public.forum_categories c WHERE c.id = category_id AND c.allow_topics = true))
      OR
      -- template: only leadership+
      (is_template = true AND public.is_leadership(auth.uid()))
    )
  );
CREATE POLICY "staff or author updates topic" ON public.forum_topics FOR UPDATE TO authenticated
  USING (auth.uid() = author_id OR public.is_staff(auth.uid()));

-- Posts
CREATE TABLE public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.forum_posts TO anon, authenticated;
GRANT INSERT ON public.forum_posts TO authenticated;
GRANT ALL ON public.forum_posts TO service_role;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts readable" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "auth posts if unlocked" ON public.forum_posts FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (SELECT 1 FROM public.forum_topics t WHERE t.id = topic_id AND t.is_locked = false)
  );

-- Seed categories
INSERT INTO public.forum_categories (section, slug, title, sort_order, allow_topics) VALUES
  ('Counter-Strike','cs-vip','VIP problémy',1,true),
  ('Counter-Strike','cs-adminstiznost','Admin Stížnost',2,true),
  ('Counter-Strike','cs-bug','Nahlášení bugu/problému',3,true),
  ('Counter-Strike','cs-prava','Chci si zažádat o práva na CS1.6 server',4,true),
  ('TeamSpeak','ts-role','Problémy rolí',1,true),
  ('TeamSpeak','ts-roomky','Problémy roomek',2,true),
  ('TeamSpeak','ts-adminstiznost','Admin stížnost',3,true),
  ('TeamSpeak','ts-bug','Nahlášení bugu/problému',4,true),
  ('TeamSpeak','ts-prava','Chci si zažádat o práva na TS3 server',5,true),
  ('Informace o webu','info-barvy','Barvy psaní',1,false),
  ('Informace o webu','info-pravidla','Pravidla fóra',2,false);
