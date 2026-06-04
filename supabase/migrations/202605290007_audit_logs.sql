-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role TEXT CHECK (actor_role IN ('owner', 'admin', 'seller')),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'organization',
  target_id TEXT,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX audit_logs_organization_id_idx ON public.audit_logs(organization_id);
CREATE INDEX audit_logs_action_idx ON public.audit_logs(action);
CREATE INDEX audit_logs_created_at_idx ON public.audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Owners can read all audit logs for their organization
CREATE POLICY "Owners can read audit logs"
ON public.audit_logs
FOR SELECT
USING (
  organization_id = public.current_profile_organization_id()
  AND public.current_profile_role() = 'owner'
);

-- Authenticated users can only register audit events for themselves and their scope
CREATE POLICY "Authenticated users can insert their own audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (
  organization_id = public.current_profile_organization_id()
  AND (actor_profile_id IS NULL OR actor_profile_id = public.current_profile_id())
  AND (actor_role IS NULL OR actor_role = public.current_profile_role())
  AND (
    team_id IS NULL
    OR public.current_profile_role() = 'owner'
    OR team_id IN (SELECT public.current_user_team_ids())
  )
);

-- Grant access
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
