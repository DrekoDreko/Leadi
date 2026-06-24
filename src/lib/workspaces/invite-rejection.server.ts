import "server-only";

import { recordAuditLog } from "@/lib/audit/audit-log.server";
import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

export type DiscardRejectedInviteResult = {
  deleted: boolean;
};

// Quando o gestor rejeita um convite, a conta que o convidado criou apenas para
// entrar na equipe precisa ser apagada. Isso libera o email para um novo convite
// — caminho mais comum, a rejeicao acidental — e devolve o consultor ao fluxo de
// criar uma conta avulsa. So apagamos contas "recem-criadas e vazias": o usuario
// e o reivindicante (requested_by_user_id) do convite rejeitado, esta sozinho na
// propria org-solo e nao tem leads nem vinculo ativo em outra organizacao. Contas
// reais (com dados) nao sao tocadas — elas apenas voltam ao proprio dashboard.
export async function discardRejectedInviteAccountForCurrentUser(
  token: string
): Promise<DiscardRejectedInviteResult> {
  // Sem service role nao da para apagar o usuario de auth (e liberar o email).
  if (!hasSupabaseServiceRole()) {
    return { deleted: false };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { deleted: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organization_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return { deleted: false };
  }

  const admin = createSupabaseAdminClient();

  // Confirma que este usuario e mesmo o reivindicante do convite rejeitado. O
  // claimant ainda nao e membro da workspace, entao lemos o convite via admin.
  const { data: invite } = await admin
    .from("invites")
    .select("id, approval_status, requested_by_user_id, workspace_id")
    .eq("token", token)
    .maybeSingle();

  if (
    !invite ||
    invite.approval_status !== "rejected" ||
    invite.requested_by_user_id !== profile.id
  ) {
    return { deleted: false };
  }

  // So apaga conta avulsa e vazia (org-solo do proprio usuario, sem dados).
  const disposable = await isDisposableSoloAccount(admin, profile.id, profile.organization_id);
  if (!disposable) {
    return { deleted: false };
  }

  // Apaga o usuario de auth: libera o email e cascateia profile e memberships.
  const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteUserError) {
    return { deleted: false };
  }

  // A org-solo nao tem cascade a partir de auth.users, entao some com a orfa.
  await admin.from("organizations").delete().eq("id", profile.organization_id);

  await recordAuditLog({
    organizationId: invite.workspace_id,
    action: "invite.reject.account_discarded",
    targetType: "invite",
    targetId: invite.id,
    status: "success",
    metadata: {
      discardedProfileId: profile.id
    }
  });

  return { deleted: true };
}

// Conta descartavel: a org-solo tem apenas este perfil, nenhum lead, e o usuario
// nao participa ativamente de outra organizacao. Qualquer dado real aborta.
async function isDisposableSoloAccount(
  admin: AdminClient,
  profileId: string,
  organizationId: string
): Promise<boolean> {
  const { count: profileCount } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if ((profileCount ?? 0) !== 1) {
    return false;
  }

  const { count: leadCount } = await admin
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if ((leadCount ?? 0) > 0) {
    return false;
  }

  const { count: otherMembershipCount } = await admin
    .from("workspace_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profileId)
    .eq("status", "active")
    .neq("workspace_id", organizationId);

  return (otherMembershipCount ?? 0) === 0;
}
