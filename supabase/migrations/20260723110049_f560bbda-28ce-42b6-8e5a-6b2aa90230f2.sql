-- Server settings editable by portal owner
CREATE TABLE IF NOT EXISTS public.server_settings (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('ts','cs','discord')),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  icon_url TEXT,
  players INTEGER NOT NULL DEFAULT 0 CHECK (players >= 0),
  max_players INTEGER CHECK (max_players IS NULL OR max_players >= 0),
  map TEXT,
  online BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.server_settings TO anon, authenticated;
GRANT UPDATE ON public.server_settings TO authenticated;
GRANT ALL ON public.server_settings TO service_role;
ALTER TABLE public.server_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "server settings readable" ON public.server_settings;
CREATE POLICY "server settings readable" ON public.server_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "server settings owner update" ON public.server_settings;
CREATE POLICY "server settings owner update" ON public.server_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'portal_owner'))
  WITH CHECK (public.has_role(auth.uid(), 'portal_owner'));

INSERT INTO public.server_settings (id, type, name, address, icon_url, players, max_players, map, online, sort_order) VALUES
  ('ts','ts','TeamSpeak Server','ts.oasigame.cz',NULL,8,64,NULL,true,1),
  ('jailbreak','cs','Cs1.6 Jailbreak','89.163.144.10:27015',NULL,14,32,'jail_oasis',true,2),
  ('discord','discord','Discord Server','dsc.gg/oasiscom',NULL,42,NULL,NULL,true,3)
ON CONFLICT (id) DO UPDATE SET
  type = EXCLUDED.type,
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  players = EXCLUDED.players,
  max_players = EXCLUDED.max_players,
  map = EXCLUDED.map,
  online = EXCLUDED.online,
  sort_order = EXCLUDED.sort_order;

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.tg_touch_updated_at() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS server_settings_touch ON public.server_settings;
CREATE TRIGGER server_settings_touch BEFORE UPDATE ON public.server_settings
FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- Remove old public role-read policy left from initial setup, keep self-read only.
DROP POLICY IF EXISTS "roles readable by all" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles readable" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles public read" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can read user_roles" ON public.user_roles;
REVOKE SELECT ON public.user_roles FROM anon;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Public forum reads should stay open to guests.
GRANT SELECT ON public.forum_categories TO anon, authenticated;
GRANT SELECT ON public.forum_topics TO anon, authenticated;
GRANT SELECT ON public.forum_posts TO anon, authenticated;
DROP POLICY IF EXISTS "categories readable" ON public.forum_categories;
CREATE POLICY "categories readable" ON public.forum_categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "topics readable" ON public.forum_topics;
CREATE POLICY "topics readable" ON public.forum_topics FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "posts readable" ON public.forum_posts;
CREATE POLICY "posts readable" ON public.forum_posts FOR SELECT TO anon, authenticated USING (true);