import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { WorkspaceContext } from "./context";
import { normalizeWorkspaceRole } from "./permissions";

type InviteRow = Database["public"]["Tables"]["invites"]["Row"];
type MemberRow = Database["public"]["Tables"]["workspace_members"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type TeamMember = {
  id: string;
  profileId: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "seller";
  status: string;
  createdAt: string;
};

export type TeamInvite = {
  id: string;
  token: string;
  invitePath: string;
  roleToAssign: "admin" | "seller";
  status: string;
  createdAt: string;
  expiresAt: string;
};

export type TeamSetupData = {
  workspaceName: string;
  members: TeamMember[];
  invites: TeamInvite[];
};

export async function getTeamSetupData(context: WorkspaceContext): Promise<TeamSetupData> {
  if (!isSupabaseConfigured() || !context.workspace) {
    return {
      workspaceName: context.workspaceName,
      members: [
        {
          id: "demo-member",
          profileId: "demo-profile",
          name: context.displayName,
          email: "demo@leadi.example",
          role: "owner",
          status: "active",
          createdAt: new Date().toISOString()
        }
      ],
      invites: []
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: memberRows } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", context.workspace.id)
    .neq("status", "removed")
    .order("created_at", { ascending: true });

  const members = await mapMembers(memberRows ?? []);

  const { data: inviteRows } = await supabase
    .from("invites")
    .select("*")
    .eq("workspace_id", context.workspace.id)
    .order("created_at", { ascending: false })
    .limit(8);

  return {
    workspaceName: context.workspace.name,
    members,
    invites: (inviteRows ?? []).map(mapInvite)
  };
}

async function mapMembers(memberRows: MemberRow[]): Promise<TeamMember[]> {
  if (memberRows.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const profileIds = memberRows.map((member) => member.user_id);
  const { data: profileRows } = await supabase
    .from("profiles")
    .select("*")
    .in("id", profileIds);

  const profilesById = new Map((profileRows ?? []).map((profile) => [profile.id, profile]));

  return memberRows.map((member) => {
    const profile = profilesById.get(member.user_id);

    return {
      id: member.id,
      profileId: member.user_id,
      name: getProfileName(profile),
      email: profile?.email ?? "sem-email@leadi.example",
      role: normalizeWorkspaceRole(member.role),
      status: member.status,
      createdAt: member.created_at
    };
  });
}

function getProfileName(profile?: ProfileRow) {
  if (!profile) {
    return "Vendedor convidado";
  }

  return profile.full_name ?? profile.email.split("@")[0] ?? "Vendedor";
}

function mapInvite(invite: InviteRow): TeamInvite {
  return {
    id: invite.id,
    token: invite.token,
    invitePath: `/invite/${invite.token}`,
    roleToAssign: normalizeWorkspaceRole(invite.role_to_assign) === "admin" ? "admin" : "seller",
    status: invite.status,
    createdAt: invite.created_at,
    expiresAt: invite.expires_at
  };
}
