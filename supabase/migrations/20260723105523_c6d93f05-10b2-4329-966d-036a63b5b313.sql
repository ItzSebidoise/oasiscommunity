-- Restrict user_roles visibility: users can only see their own roles
DROP POLICY IF EXISTS "user_roles readable" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles public read" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can read user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

REVOKE SELECT ON public.user_roles FROM anon;