import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, ProfileRole, WorkspaceType } from "@/lib/supabase/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type WorkspaceRow = Database["public"]["Tables"]["organizations"]["Row"];

export type DashboardNavVariant = "seller-solo" | "seller-team" | "supervisor-team";

export type WorkspaceContext = {
  mode: "supabase" | "not-configured";
  profile: ProfileRow | null;
  workspace: WorkspaceRow | null;
  role: Extract<ProfileRole, "seller" | "supervisor">;
  workspaceType: WorkspaceType;
  displayName: string;
  workspaceName: string;
  brokerageName: string;
  profileSetupCompleted: boolean;
  isSupervisor: boolean;
  isSoloSeller: boolean;
  isTeamSeller: boolean;
  navVariant: DashboardNavVariant;
};

const demoWorkspaceContext: WorkspaceContext = {
  mode: "not-configured",
  profile: null,
  workspace: null,
  role: "supervisor",
  workspaceType: "team",
  displayName: "Demo",
  workspaceName: "Corretora Demo",
  brokerageName: "Corretora Demo",
  profileSetupCompleted: true,
  isSupervisor: true,
  isSoloSeller: false,
  isTeamSeller: false,
  navVariant: "supervisor-team"
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

  const role = normalizeRole(profile.role);
  const workspaceType = workspace.type;
  const isSupervisor = role === "supervisor";
  const isSoloSeller = role === "seller" && workspaceType === "solo";
  const isTeamSeller = role === "seller" && workspaceType === "team";

  return {
    mode: "supabase",
    profile,
    workspace,
    role,
    workspaceType,
    displayName: profile.full_name ?? profile.email.split("@")[0] ?? "Usuario",
    workspaceName: workspace.name,
    brokerageName: workspace.name,
    profileSetupCompleted: profile.profile_setup_completed,
    isSupervisor,
    isSoloSeller,
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

export async function requireSupervisor() {
  const context = await requireCompletedProfile();

  if (context.mode === "supabase" && !context.isSupervisor) {
    redirect("/dashboard");
  }

  return context;
}

export async function requireImportPermission() {
  const context = await requireCompletedProfile();

  if (context.mode === "supabase" && !context.isSupervisor && !context.isSoloSeller) {
    redirect("/dashboard");
  }

  return context;
}

export async function requireSoloSeller() {
  const context = await requireCompletedProfile();

  if (context.mode === "supabase" && !context.isSoloSeller) {
    redirect("/dashboard");
  }

  return context;
}

function normalizeRole(role: ProfileRole): Extract<ProfileRole, "seller" | "supervisor"> {
  return role === "supervisor" ? "supervisor" : "seller";
}

function getDashboardNavVariant(
  role: Extract<ProfileRole, "seller" | "supervisor">,
  workspaceType: WorkspaceType
): DashboardNavVariant {
  if (role === "supervisor") {
    return "supervisor-team";
  }

  return workspaceType === "team" ? "seller-team" : "seller-solo";
}
