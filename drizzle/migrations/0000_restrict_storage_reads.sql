DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
DROP POLICY IF EXISTS "news public read" ON storage.objects;
DROP POLICY IF EXISTS "server-icons public read" ON storage.objects;
CREATE POLICY "avatars owner read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "news leadership read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'news' AND public.is_portal_leadership(auth.uid()));
CREATE POLICY "server-icons leadership read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'server-icons' AND public.is_portal_leadership(auth.uid()));