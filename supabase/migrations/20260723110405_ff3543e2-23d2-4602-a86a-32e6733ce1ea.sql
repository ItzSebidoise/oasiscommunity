
DROP POLICY IF EXISTS "server-icons public read" ON storage.objects;
CREATE POLICY "server-icons public read" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'server-icons');

DROP POLICY IF EXISTS "server-icons portal owner write" ON storage.objects;
CREATE POLICY "server-icons portal owner write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'server-icons' AND public.is_portal_leadership(auth.uid()));

DROP POLICY IF EXISTS "server-icons portal owner update" ON storage.objects;
CREATE POLICY "server-icons portal owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'server-icons' AND public.is_portal_leadership(auth.uid()));

DROP POLICY IF EXISTS "server-icons portal owner delete" ON storage.objects;
CREATE POLICY "server-icons portal owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'server-icons' AND public.is_portal_leadership(auth.uid()));

DROP POLICY IF EXISTS "server settings owner update" ON public.server_settings;
DROP POLICY IF EXISTS "server settings leadership update" ON public.server_settings;
CREATE POLICY "server settings leadership update" ON public.server_settings FOR UPDATE TO authenticated
  USING (public.is_portal_leadership(auth.uid()))
  WITH CHECK (public.is_portal_leadership(auth.uid()));
