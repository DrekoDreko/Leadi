-- Link leads and campaigns to teams and scope supervisor lead access by team.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS leads_team_id_idx
  ON public.leads (team_id);

CREATE INDEX IF NOT EXISTS leads_organization_team_id_idx
  ON public.leads (organization_id, team_id);

CREATE INDEX IF NOT EXISTS campaigns_team_id_idx
  ON public.campaigns (team_id);

CREATE INDEX IF NOT EXISTS campaigns_organization_team_id_idx
  ON public.campaigns (organization_id, team_id);

CREATE OR REPLACE FUNCTION public.assign_lead_team_id_from_owner()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.team_id IS NULL AND NEW.owner_profile_id IS NOT NULL THEN
    SELECT team_member_row.team_id
    INTO NEW.team_id
    FROM public.team_members AS team_member_row
    WHERE team_member_row.profile_id = NEW.owner_profile_id
      AND team_member_row.organization_id = NEW.organization_id
      AND team_member_row.status = 'active'
    ORDER BY team_member_row.created_at ASC
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_assign_team_id_from_owner ON public.leads;
CREATE TRIGGER leads_assign_team_id_from_owner
BEFORE INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.assign_lead_team_id_from_owner();

CREATE OR REPLACE FUNCTION public.assign_campaign_team_id_from_creator()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.team_id IS NULL AND NEW.created_by_profile_id IS NOT NULL THEN
    SELECT team_member_row.team_id
    INTO NEW.team_id
    FROM public.team_members AS team_member_row
    WHERE team_member_row.profile_id = NEW.created_by_profile_id
      AND team_member_row.organization_id = NEW.organization_id
      AND team_member_row.status = 'active'
    ORDER BY team_member_row.created_at ASC
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS campaigns_assign_team_id_from_creator ON public.campaigns;
CREATE TRIGGER campaigns_assign_team_id_from_creator
BEFORE INSERT ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.assign_campaign_team_id_from_creator();

DROP POLICY IF EXISTS "Members can read permitted workspace leads" ON public.leads;
CREATE POLICY "Members can read permitted workspace leads"
ON public.leads
FOR SELECT
USING (
  organization_id = public.current_profile_organization_id()
  AND (
    public.current_profile_role() = 'owner'
    OR (
      public.current_profile_role() IN ('admin', 'supervisor')
      AND (
        team_id IN (SELECT public.current_user_team_ids())
        OR (team_id IS NULL AND owner_profile_id = public.current_profile_id())
      )
    )
    OR (
      public.current_profile_role() = 'seller'
      AND owner_profile_id = public.current_profile_id()
    )
  )
);

DROP POLICY IF EXISTS "Owners and admins can update organization leads" ON public.leads;
CREATE POLICY "Owners and admins can update organization leads"
ON public.leads
FOR UPDATE
USING (
  organization_id = public.current_profile_organization_id()
  AND (
    public.current_profile_role() = 'owner'
    OR (
      public.current_profile_role() IN ('admin', 'supervisor')
      AND (
        team_id IN (SELECT public.current_user_team_ids())
        OR (team_id IS NULL AND owner_profile_id = public.current_profile_id())
      )
    )
  )
)
WITH CHECK (
  organization_id = public.current_profile_organization_id()
  AND (
    public.current_profile_role() = 'owner'
    OR (
      public.current_profile_role() IN ('admin', 'supervisor')
      AND (
        team_id IN (SELECT public.current_user_team_ids())
        OR (team_id IS NULL AND owner_profile_id = public.current_profile_id())
      )
    )
  )
);

DROP POLICY IF EXISTS "Lead owners can update own non Meta leads" ON public.leads;
CREATE POLICY "Lead owners can update own non Meta leads"
ON public.leads
FOR UPDATE
USING (
  organization_id = public.current_profile_organization_id()
  AND public.current_profile_role() = 'seller'
  AND owner_profile_id = public.current_profile_id()
  AND source <> 'meta_lead_ads'
)
WITH CHECK (
  organization_id = public.current_profile_organization_id()
  AND public.current_profile_role() = 'seller'
  AND owner_profile_id = public.current_profile_id()
  AND source <> 'meta_lead_ads'
);

DROP POLICY IF EXISTS "Owners and admins can delete organization leads" ON public.leads;
CREATE POLICY "Owners and admins can delete organization leads"
ON public.leads
FOR DELETE
USING (
  organization_id = public.current_profile_organization_id()
  AND (
    public.current_profile_role() = 'owner'
    OR (
      public.current_profile_role() IN ('admin', 'supervisor')
      AND (
        team_id IN (SELECT public.current_user_team_ids())
        OR (team_id IS NULL AND owner_profile_id = public.current_profile_id())
      )
    )
  )
);

DROP POLICY IF EXISTS "Lead owners can delete own non Meta leads" ON public.leads;
CREATE POLICY "Lead owners can delete own non Meta leads"
ON public.leads
FOR DELETE
USING (
  organization_id = public.current_profile_organization_id()
  AND public.current_profile_role() = 'seller'
  AND owner_profile_id = public.current_profile_id()
  AND source <> 'meta_lead_ads'
);

NOTIFY pgrst, 'reload schema';
