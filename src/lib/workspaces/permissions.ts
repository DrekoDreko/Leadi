import type { ProfileRole, WorkspaceType } from "@/lib/supabase/database.types";

export type WorkspaceRole = Extract<ProfileRole, "owner" | "admin" | "seller">;

export function normalizeWorkspaceRole(role: string | null | undefined): WorkspaceRole {
  if (role === "owner" || role === "admin" || role === "seller") {
    return role;
  }

  if (role === "supervisor") {
    return "admin";
  }

  return "seller";
}

export function isWorkspaceManagerRole(role: string | null | undefined) {
  const normalizedRole = normalizeWorkspaceRole(role);

  return normalizedRole === "owner" || normalizedRole === "admin";
}

export function canManageWorkspaceSettings(
  role: string | null | undefined,
  workspaceType: WorkspaceType
) {
  const normalizedRole = normalizeWorkspaceRole(role);

  if (workspaceType === "solo") {
    return normalizedRole === "owner";
  }

  return normalizedRole === "owner" || normalizedRole === "admin";
}

export function canInviteWorkspaceMember(
  role: string | null | undefined,
  workspaceType: WorkspaceType,
  targetRole: "admin" | "seller"
) {
  const normalizedRole = normalizeWorkspaceRole(role);

  if (workspaceType !== "team") {
    return false;
  }

  if (normalizedRole === "owner") {
    return true;
  }

  return normalizedRole === "admin" && targetRole === "seller";
}

export function canManageWorkspaceMemberRole(
  role: string | null | undefined,
  targetRole: string | null | undefined,
  nextRole: "admin" | "seller"
) {
  const normalizedRole = normalizeWorkspaceRole(role);
  const normalizedTargetRole = normalizeWorkspaceRole(targetRole);

  if (normalizedTargetRole === "owner") {
    return false;
  }

  if (normalizedRole === "owner") {
    return true;
  }

  return normalizedRole === "admin" && nextRole === "seller" && normalizedTargetRole === "seller";
}

export function canRemoveWorkspaceMember(
  role: string | null | undefined,
  targetRole: string | null | undefined
) {
  const normalizedRole = normalizeWorkspaceRole(role);
  const normalizedTargetRole = normalizeWorkspaceRole(targetRole);

  if (normalizedTargetRole === "owner") {
    return false;
  }

  if (normalizedRole === "owner") {
    return true;
  }

  return normalizedRole === "admin" && normalizedTargetRole === "seller";
}
