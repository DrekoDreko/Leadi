-- Create approval_requests table
CREATE TABLE public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN (
    'credit_purchase', 'credit_allocation', 'ad_publication',
    'ad_budget_increase', 'member_add', 'member_remove'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'cancelled'
  )),
  requested_by_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewed_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX approval_requests_organization_id_idx ON public.approval_requests(organization_id);
CREATE INDEX approval_requests_team_id_idx ON public.approval_requests(team_id);
CREATE INDEX approval_requests_requested_by_idx ON public.approval_requests(requested_by_profile_id);
CREATE INDEX approval_requests_status_idx ON public.approval_requests(status);

-- Enable RLS
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Owners can do everything on approval requests for their organization
CREATE POLICY "Owners can manage approval requests"
ON public.approval_requests
FOR ALL
USING (
  organization_id = public.current_profile_organization_id()
  AND public.current_profile_role() = 'owner'
);

-- Admins (Supervisors) can view requests they created or belonging to their team
CREATE POLICY "Admins can view their team approval requests"
ON public.approval_requests
FOR SELECT
USING (
  organization_id = public.current_profile_organization_id()
  AND public.current_profile_role() = 'admin'
  AND (
    requested_by_profile_id = public.current_profile_id()
    OR team_id IN (SELECT public.current_user_team_ids())
  )
);

-- Admins can insert new requests as pending
CREATE POLICY "Admins can insert pending approval requests"
ON public.approval_requests
FOR INSERT
WITH CHECK (
  organization_id = public.current_profile_organization_id()
  AND public.current_profile_role() = 'admin'
  AND requested_by_profile_id = public.current_profile_id()
  AND status = 'pending'
);

-- Admins can update their own pending requests to cancel them
CREATE POLICY "Admins can cancel their own approval requests"
ON public.approval_requests
FOR UPDATE
USING (
  organization_id = public.current_profile_organization_id()
  AND public.current_profile_role() = 'admin'
  AND requested_by_profile_id = public.current_profile_id()
  AND status = 'pending'
)
WITH CHECK (
  status = 'cancelled'
);

-- Trigger for updated_at
CREATE TRIGGER approval_requests_set_updated_at
BEFORE UPDATE ON public.approval_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_requests TO authenticated;
