-- Create ad_approval_requests table
CREATE TABLE public.ad_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  requested_by_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewed_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'needs_adjustment'
  )),
  review_notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX ad_approval_requests_organization_id_idx ON public.ad_approval_requests(organization_id);
CREATE INDEX ad_approval_requests_team_id_idx ON public.ad_approval_requests(team_id);
CREATE INDEX ad_approval_requests_campaign_id_idx ON public.ad_approval_requests(campaign_id);
CREATE INDEX ad_approval_requests_requested_by_idx ON public.ad_approval_requests(requested_by_profile_id);
CREATE INDEX ad_approval_requests_status_idx ON public.ad_approval_requests(status);

-- Enable RLS
ALTER TABLE public.ad_approval_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Owners can do everything on ad approval requests for their organization
CREATE POLICY "Owners can manage ad approval requests"
ON public.ad_approval_requests
FOR ALL
USING (
  organization_id = public.current_profile_organization_id()
  AND public.current_profile_role() = 'owner'
);

-- Admins (Supervisors) can view requests they created or belonging to their team
CREATE POLICY "Admins can view their team ad approval requests"
ON public.ad_approval_requests
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
CREATE POLICY "Admins can insert pending ad approval requests"
ON public.ad_approval_requests
FOR INSERT
WITH CHECK (
  organization_id = public.current_profile_organization_id()
  AND public.current_profile_role() = 'admin'
  AND requested_by_profile_id = public.current_profile_id()
  AND status = 'pending'
);

-- Trigger for updated_at
CREATE TRIGGER ad_approval_requests_set_updated_at
BEFORE UPDATE ON public.ad_approval_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_approval_requests TO authenticated;
