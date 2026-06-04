import type { ProfileRole, WorkspaceType } from "@/lib/supabase/database.types";
import { PERMISSION_MAP, type Permission } from "./permission-map";

export type WorkspaceRole = Extract<ProfileRole, "owner" | "admin" | "seller">;

/**
 * Mapeamento de papéis técnicos para papéis de produto na interface.
 * owner: Gestor (Dono da corretora, acesso total, poder financeiro final)
 * admin: Supervisor (Gerencia equipe, sem acesso financeiro direto)
 * seller: Consultor (Operacional, trabalha apenas seus leads)
 */
export const ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: "Gestor",
  admin: "Supervisor",
  seller: "Consultor",
};

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

export function can(role: string | null | undefined, permission: Permission): boolean {
  const normalizedRole = normalizeWorkspaceRole(role);
  const allowedRoles = PERMISSION_MAP[permission] || [];
  
  return allowedRoles.includes(normalizedRole);
}

export function canOrThrow(role: string | null | undefined, permission: Permission, customMessage?: string): void {
  if (!can(role, permission)) {
    throw new Error(customMessage || `Access denied. Requires permission: ${permission}`);
  }
}

export function canAll(role: string | null | undefined, permissions: Permission[]): boolean {
  if (!permissions.length) return true;
  return permissions.every((p) => can(role, p));
}

export function canAny(role: string | null | undefined, permissions: Permission[]): boolean {
  if (!permissions.length) return false;
  return permissions.some((p) => can(role, p));
}

