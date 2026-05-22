-- Migration: 202605210007_lead_stage_history
-- Description: Create lead stage history table for tracking stage transitions

CREATE TABLE public.lead_stage_history (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    changed_by_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    old_stage text,
    new_stage text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT lead_stage_history_pkey PRIMARY KEY (id)
);

-- Indices for performance
CREATE INDEX idx_lead_stage_history_organization_id ON public.lead_stage_history USING btree (organization_id);
CREATE INDEX idx_lead_stage_history_lead_id ON public.lead_stage_history USING btree (lead_id);
CREATE INDEX idx_lead_stage_history_created_at ON public.lead_stage_history USING btree (created_at);

-- RLS
ALTER TABLE public.lead_stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lead stage history from their organization"
    ON public.lead_stage_history
    FOR SELECT
    USING (
      organization_id = (SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1)
    );

CREATE POLICY "Users can insert lead stage history to their organization"
    ON public.lead_stage_history
    FOR INSERT
    WITH CHECK (
      organization_id = (SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1)
    );
