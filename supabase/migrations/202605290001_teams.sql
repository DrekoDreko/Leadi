-- Create teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('supervisor', 'consultant')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending_approval')),
  added_by_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  approved_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, profile_id)
);

-- Indexes
CREATE INDEX teams_organization_id_idx ON public.teams(organization_id);
CREATE INDEX team_members_team_id_idx ON public.team_members(team_id);
CREATE INDEX team_members_profile_id_idx ON public.team_members(profile_id);
CREATE INDEX team_members_organization_id_idx ON public.team_members(organization_id);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Helper function to avoid RLS recursion when checking a user's teams
CREATE OR REPLACE FUNCTION public.current_user_team_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM public.team_members WHERE profile_id = public.current_profile_id();
$$;

-- RLS Policies for teams
CREATE POLICY "Owners can manage teams"
ON public.teams
FOR ALL
USING (
  organization_id = public.current_profile_organization_id()
  AND public.current_profile_role() = 'owner'
);

CREATE POLICY "Admins and Sellers can view their own teams"
ON public.teams
FOR SELECT
USING (
  organization_id = public.current_profile_organization_id()
  AND id IN (SELECT public.current_user_team_ids())
);

-- RLS Policies for team_members
CREATE POLICY "Owners can manage team members"
ON public.team_members
FOR ALL
USING (
  organization_id = public.current_profile_organization_id()
  AND public.current_profile_role() = 'owner'
);

CREATE POLICY "Admins can view members of their teams"
ON public.team_members
FOR SELECT
USING (
  organization_id = public.current_profile_organization_id()
  AND public.current_profile_role() = 'admin'
  AND team_id IN (SELECT public.current_user_team_ids())
);

CREATE POLICY "Admins can update members of their teams"
ON public.team_members
FOR UPDATE
USING (
  organization_id = public.current_profile_organization_id()
  AND public.current_profile_role() = 'admin'
  AND team_id IN (SELECT public.current_user_team_ids())
);

CREATE POLICY "Admins can insert members to their teams"
ON public.team_members
FOR INSERT
WITH CHECK (
  organization_id = public.current_profile_organization_id()
  AND public.current_profile_role() = 'admin'
  AND team_id IN (SELECT public.current_user_team_ids())
);

CREATE POLICY "Sellers can view their own team membership"
ON public.team_members
FOR SELECT
USING (
  organization_id = public.current_profile_organization_id()
  AND profile_id = public.current_profile_id()
);

-- Triggers for updated_at
CREATE TRIGGER teams_set_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER team_members_set_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_team_ids() TO authenticated;
