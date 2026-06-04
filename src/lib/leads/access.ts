import type { LeadSource } from "@/lib/supabase/database.types";
import {
  normalizeWorkspaceRole,
  type WorkspaceRole
} from "@/lib/workspaces/permissions";

export type LeadAccessScope = {
  role: WorkspaceRole;
  profileId: string;
  teamIds: string[];
};

type LeadAccessScopeInput = {
  role: string | null | undefined;
  profileId: string;
  teamIds?: string[] | null;
};

type LeadScopeRow = {
  owner_profile_id: string | null;
  team_id: string | null;
  source: LeadSource;
};

export function createLeadAccessScope(input: LeadAccessScopeInput): LeadAccessScope {
  return {
    role: normalizeWorkspaceRole(input.role),
    profileId: input.profileId,
    teamIds: [...new Set((input.teamIds ?? []).filter(Boolean))]
  };
}

export function canReadLeadWithScope(scope: LeadAccessScope, lead: LeadScopeRow) {
  if (scope.role === "owner") {
    return true;
  }

  if (scope.role === "admin") {
    return lead.team_id !== null && scope.teamIds.includes(lead.team_id);
  }

  return lead.owner_profile_id === scope.profileId;
}

export function canManageLeadWithScope(
  scope: LeadAccessScope,
  lead: LeadScopeRow,
  hasMetaConnection = false
) {
  if (scope.role === "owner") {
    return true;
  }

  if (scope.role === "admin") {
    return canReadLeadWithScope(scope, lead);
  }

  return (
    lead.owner_profile_id === scope.profileId &&
    (lead.source !== "meta_lead_ads" || hasMetaConnection)
  );
}
