
-- Platform admins table
CREATE TABLE IF NOT EXISTS public.platform_admins (
  auth_user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Only platform admins can see this table (self-only)
CREATE POLICY platform_admins_select_self ON public.platform_admins
  FOR SELECT USING (auth_user_id = auth.uid());

-- Helper function: is the current user a platform admin?
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins WHERE auth_user_id = auth.uid()
  );
$$;

-- Allow platform admins to INSERT new etudes
CREATE POLICY etudes_insert_platform_admin ON public.etudes
  FOR INSERT WITH CHECK (public.is_platform_admin());

-- Allow platform admins to SELECT all etudes
CREATE POLICY etudes_select_platform_admin ON public.etudes
  FOR SELECT USING (public.is_platform_admin());

-- Seed the platform admin
INSERT INTO public.platform_admins (auth_user_id)
VALUES ('50a7ca88-4566-4f8a-bb25-f8fe246789e6')
ON CONFLICT DO NOTHING;
