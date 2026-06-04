-- Create credit_requests table
CREATE TABLE public.credit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  requested_by_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  approved_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('team', 'user', 'campaign', 'image')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'cancelled'
  )),
  amount_requested INTEGER NOT NULL,
  amount_approved INTEGER,
  credits_per_consultant INTEGER,
  consultant_count INTEGER,
  reason TEXT NOT NULL,
  review_notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX credit_requests_organization_id_idx ON public.credit_requests(organization_id);
CREATE INDEX credit_requests_team_id_idx ON public.credit_requests(team_id);
CREATE INDEX credit_requests_requested_by_idx ON public.credit_requests(requested_by_profile_id);
CREATE INDEX credit_requests_status_idx ON public.credit_requests(status);

-- Enable RLS
ALTER TABLE public.credit_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Owners can do everything on credit requests for their organization
CREATE POLICY "Owners can manage credit requests"
ON public.credit_requests
FOR ALL
USING (
  organization_id = public.current_profile_organization_id()
  AND public.current_profile_role() = 'owner'
);

-- Admins (Supervisors) can view requests they created or belonging to their team
CREATE POLICY "Admins can view their team credit requests"
ON public.credit_requests
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
CREATE POLICY "Admins can insert pending credit requests"
ON public.credit_requests
FOR INSERT
WITH CHECK (
  organization_id = public.current_profile_organization_id()
  AND public.current_profile_role() = 'admin'
  AND requested_by_profile_id = public.current_profile_id()
  AND status = 'pending'
);

-- Admins can update their own pending requests to cancel them
CREATE POLICY "Admins can cancel their own credit requests"
ON public.credit_requests
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
CREATE TRIGGER credit_requests_set_updated_at
BEFORE UPDATE ON public.credit_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_requests TO authenticated;
