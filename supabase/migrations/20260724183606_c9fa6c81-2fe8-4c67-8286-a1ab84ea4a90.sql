CREATE TABLE public.credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nick text NOT NULL,
  role text NOT NULL,
  avatar_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.credits TO anon, authenticated;
GRANT ALL ON public.credits TO service_role;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read credits" ON public.credits FOR SELECT USING (true);
CREATE POLICY "Portal leadership manage credits" ON public.credits FOR ALL TO authenticated
  USING (public.is_portal_leadership(auth.uid())) WITH CHECK (public.is_portal_leadership(auth.uid()));

INSERT INTO public.credits (nick, role, sort_order) VALUES
  ('T3RM1N4T0R.exe', 'Muzika, Nápady', 1),
  ('Icyy', 'Nápady a testování', 2),
  ('XxNamiyXx', 'Nápady, testování a pomoc s kódem', 3),
  ('Seb1k_', 'Hlavní developer, testovatel atd.', 4),
  ('Vudce', 'Testovatel', 5);