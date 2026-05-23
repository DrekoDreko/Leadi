import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, WorkspaceType } from "@/lib/supabase/database.types";
import { isWorkspaceManagerRole, normalizeWorkspaceRole, type WorkspaceRole } from "./permissions";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type WorkspaceRow = Database["public"]["Tables"]["organizations"]["Row"];

export type DashboardNavVariant = "owner-solo" | "seller-team" | "owner-team";

export type WorkspaceContext = {
  mode: "supabase" | "not-configured";
  profile: ProfileRow | null;
  workspace: WorkspaceRow | null;
  role: WorkspaceRole;
  isPlatformAdmin: boolean;
  workspaceType: WorkspaceType;
  displayName: string;
  workspaceName: string;
  brokerageName: string;
  profileSetupCompleted: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isSoloOwner: boolean;
  isTeamSeller: boolean;
  navVariant: DashboardNavVariant;
};

const demoWorkspaceContext: WorkspaceContext = {
  mode: "not-configured",
  profile: null,
  workspace: null,
  role: "owner",
  isPlatformAdmin: true,
  workspaceType: "team",
  displayName: "Demo",
  workspaceName: "Corretora Demo",
  brokerageName: "Corretora Demo",
  profileSetupCompleted: true,
  isOwner: true,
  isAdmin: false,
  isManager: true,
  isSoloOwner: false,
  isTeamSeller: false,
  navVariant: "owner-team"
};

export async function getCurrentWorkspaceContext(): Promise<WorkspaceContext> {
  if (!isSupabaseConfigured()) {
    return demoWorkspaceContext;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login");
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", profile.organization_id)
    .single();

  if (workspaceError || !workspace) {
    redirect("/login");
  }

  const role = normalizeWorkspaceRole(profile.role);
  const workspaceType = workspace.type;
  const isOwner = role === "owner";
  const isAdmin = role === "admin";
  const isManager = isWorkspaceManagerRole(role);
  const isSoloOwner = role === "owner" && workspaceType === "solo";
  const isTeamSeller = role === "seller" && workspaceType === "team";

  return {
    mode: "supabase",
    profile,
    workspace,
    role,
    isPlatformAdmin: Boolean(profile.is_platform_admin),
    workspaceType,
    displayName: profile.full_name ?? profile.email.split("@")[0] ?? "Usuario",
    workspaceName: workspace.name,
    brokerageName: workspace.name,
    profileSetupCompleted: profile.profile_setup_completed,
    isOwner,
    isAdmin,
    isManager,
    isSoloOwner,
    isTeamSeller,
    navVariant: getDashboardNavVariant(role, workspaceType)
  };
}

export async function requireCompletedProfile() {
  const context = await getCurrentWorkspaceContext();

  if (context.mode === "supabase" && !context.profileSetupCompleted) {
    redirect("/onboarding/profile-setup");
  }

  return context;
}

export async function requireWorkspaceManager() {
  const context = await requireCompletedProfile();

  if (context.mode === "supabase" && !context.isManager) {
    redirect("/dashboard");
  }

  return context;
}

export async function requireImportPermission() {
  const context = await requireCompletedProfile();

  if (context.mode === "supabase" && !context.isManager && !context.isSoloOwner) {
    redirect("/dashboard");
  }

  return context;
}

export async function requireSoloOwner() {
  const context = await requireCompletedProfile();

  if (context.mode === "supabase" && !context.isSoloOwner) {
    redirect("/dashboard");
  }

  return context;
}

export async function requirePlatformAdmin() {
  const context = await requireCompletedProfile();

  if (context.mode === "supabase" && !context.isPlatformAdmin) {
    redirect("/dashboard");
  }

  return context;
}

function getDashboardNavVariant(
  role: WorkspaceRole,
  workspaceType: WorkspaceType
): DashboardNavVariant {
  if (workspaceType === "solo") {
    return "owner-solo";
  }

  if (role === "owner" || role === "admin") {
    return "owner-team";
  }

  return "seller-team";
}
