-- Create lead_assignments table
CREATE TABLE public.lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  assigned_to_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assigned_by_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  previous_owner_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX lead_assignments_organization_id_idx ON public.lead_assignments(organization_id);
CREATE INDEX lead_assignments_team_id_idx ON public.lead_assignments(team_id);
CREATE INDEX lead_assignments_lead_id_idx ON public.lead_assignments(lead_id);
CREATE INDEX lead_assignments_assigned_to_profile_id_idx ON public.lead_assignments(assigned_to_profile_id);
CREATE INDEX lead_assignments_assigned_by_profile_id_idx ON public.lead_assignments(assigned_by_profile_id);
CREATE INDEX lead_assignments_lead_created_at_idx ON public.lead_assignments(lead_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.lead_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Owners can manage lead assignment history for their organization
CREATE POLICY "Owners can manage lead assignments"
ON public.lead_assignments
FOR ALL
USING (
  organization_id = public.current_profile_organization_id()
  AND public.current_profile_role() = 'owner'
);

-- Admins can view assignment history for their own teams
CREATE POLICY "Admins can view their team lead assignments"
ON public.lead_assignments
FOR SELECT
USING (
  organization_id = public.current_profile_organization_id()
  AND public.current_profile_role() = 'admin'
  AND team_id IN (SELECT public.current_user_team_ids())
);

-- Admins can register new assignments for their own teams
CREATE POLICY "Admins can insert lead assignments for their teams"
ON public.lead_assignments
FOR INSERT
WITH CHECK (
  organization_id = public.current_profile_organization_id()
  AND public.current_profile_role() = 'admin'
  AND assigned_by_profile_id = public.current_profile_id()
  AND team_id IN (SELECT public.current_user_team_ids())
);

-- Sellers can view only assignment history that directly affects them
CREATE POLICY "Sellers can view their own lead assignments"
ON public.lead_assignments
FOR SELECT
USING (
  organization_id = public.current_profile_organization_id()
  AND public.current_profile_role() = 'seller'
  AND (
    assigned_to_profile_id = public.current_profile_id()
    OR previous_owner_profile_id = public.current_profile_id()
  )
);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_assignments TO authenticated;
