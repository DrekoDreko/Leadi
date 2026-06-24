import "server-only";

import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveCurrentIdentity } from "@/lib/integrations/repository.server";
import type { NotificationItem, NotificationListState, NotificationType } from "./types";

type NotificationRow = {
  id: string;
  organization_id: string;
  recipient_profile_id: string | null;
  type: NotificationType;
  title: string;
  body: string | null;
  link_url: string | null;
  campaign_id: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    linkUrl: row.link_url,
    campaignId: row.campaign_id,
    readAt: row.read_at,
    createdAt: row.created_at
  };
}

const EMPTY_STATE: NotificationListState = { notifications: [], unreadCount: 0 };

// Lista as notificacoes visiveis para o usuario atual. A RLS ja restringe ao
// escopo da organizacao/destinatario; nao lancamos por falta de auth para nao
// derrubar o sino — devolvemos estado vazio.
export async function getNotificationsForCurrentUser(limit = 30): Promise<NotificationListState> {
  const identity = await resolveCurrentIdentity().catch(() => null);
  if (!identity) {
    return EMPTY_STATE;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("read_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return EMPTY_STATE;
  }

  let rows = ((data as NotificationRow[] | null) ?? []).map(mapRow);

  if (identity.profile.role === "owner") {
    // So notificamos quando ha um convidado que reivindicou o convite (criou a
    // conta a partir do link) e aguarda aprovacao — antes disso nao ha o que aprovar.
    const { data: pendingInvites } = await supabase
      .from("invites")
      .select("*")
      .eq("workspace_id", identity.organization.id)
      .eq("approval_status", "pending")
      .eq("status", "active")
      .eq("requires_approval", true)
      .not("requested_by_user_id", "is", null);

    if (pendingInvites && pendingInvites.length > 0) {
      const claimantIds = [
        ...new Set(
          pendingInvites
            .map((invite) => invite.requested_by_user_id as string | null)
            .filter((value): value is string => Boolean(value))
        )
      ];

      const claimantNamesById = new Map<string, string>();
      if (claimantIds.length > 0) {
        // O reivindicante ainda nao e membro da org (convite pendente), entao o
        // RLS do owner nao enxerga o perfil dele. Resolvemos o nome pelo client
        // admin. Escopo seguro: os convites ja sao filtrados por workspace_id.
        const { data: claimantRows } = hasSupabaseServiceRole()
          ? await createSupabaseAdminClient()
              .from("profiles")
              .select("id, full_name, email")
              .in("id", claimantIds)
          : await supabase.from("profiles").select("id, full_name, email").in("id", claimantIds);

        for (const claimant of claimantRows ?? []) {
          claimantNamesById.set(
            claimant.id,
            claimant.full_name ?? claimant.email?.split("@")[0] ?? "Um convidado"
          );
        }
      }

      const inviteNotifications: NotificationItem[] = pendingInvites.map((invite) => {
        const claimantName =
          claimantNamesById.get(invite.requested_by_user_id as string) ?? "Um convidado";

        return {
          id: `invite-${invite.id}`,
          type: "invite_pending",
          title: "Convite aguardando aprovacao",
          body: `${claimantName} solicitou acesso a equipe. Aprove para liberar.`,
          linkUrl: "/dashboard/equipes",
          campaignId: null,
          readAt: null,
          createdAt: invite.created_at
        };
      });

      rows = [...inviteNotifications, ...rows];
    }
  }

  return {
    notifications: rows,
    unreadCount: rows.filter((item) => item.readAt === null).length
  };
}

export async function markNotificationReadForCurrentUser(notificationId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .is("read_at", null);

  if (error) {
    throw new Error(error.message);
  }
}

export async function markAllNotificationsReadForCurrentUser(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);

  if (error) {
    throw new Error(error.message);
  }
}

// Cria (ou ignora, se ja existir) uma notificacao de aprovacao/reprovacao de
// campanha. Chamada pela reconciliacao de status, que roda com service role.
// O indice unico (campaign_id, type) garante idempotencia entre execucoes do
// reconciliador em lote, entao usamos upsert com ignoreDuplicates.
export async function createCampaignReviewNotification(input: {
  organizationId: string;
  campaignId: string;
  recipientProfileId: string | null;
  type: Extract<NotificationType, "campaign_approved" | "campaign_rejected">;
  title: string;
  body: string;
  linkUrl: string;
}): Promise<void> {
  if (!hasSupabaseServiceRole()) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("notifications")
    .upsert(
      {
        organization_id: input.organizationId,
        recipient_profile_id: input.recipientProfileId,
        campaign_id: input.campaignId,
        type: input.type,
        title: input.title,
        body: input.body,
        link_url: input.linkUrl
      },
      { onConflict: "campaign_id,type", ignoreDuplicates: true }
    );

  if (error) {
    // Notificacao e best-effort: nao deve quebrar a reconciliacao de status.
    throw new Error(error.message);
  }
}

// Avisa o consultor que o owner liberou (ou revogou) a criação de anúncios com IA.
// Best-effort: não deve quebrar a ação do owner.
export async function createAdCreationGrantNotification(input: {
  organizationId: string;
  recipientProfileId: string;
  enabled: boolean;
}): Promise<void> {
  if (!hasSupabaseServiceRole()) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("notifications").insert({
    organization_id: input.organizationId,
    recipient_profile_id: input.recipientProfileId,
    type: "ad_creation_enabled",
    title: input.enabled
      ? "Você foi liberado para criar anúncios"
      : "Sua liberação para criar anúncios foi removida",
    body: input.enabled
      ? "Conecte sua conta Meta em Perfil > Minha conexão Meta e comece a criar anúncios com IA."
      : "O gestor removeu sua permissão de criar anúncios com IA.",
    link_url: input.enabled ? "/dashboard/perfil/meta" : null
  });

  if (error) {
    throw new Error(error.message);
  }
}

// Avisa o supervisor que um consultor entrou (ou foi transferido para) a equipe
// dele. Best-effort: e tolerante a falha para nao quebrar a reatribuicao.
export async function createTeamMemberAddedNotification(input: {
  organizationId: string;
  recipientProfileId: string;
  memberName: string;
  teamName: string;
}): Promise<void> {
  if (!hasSupabaseServiceRole()) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  // Notificacao informativa: sem link (o supervisor nao tem pagina de equipe
  // dedicada e o texto ja e auto-explicativo).
  const { error } = await supabase.from("notifications").insert({
    organization_id: input.organizationId,
    recipient_profile_id: input.recipientProfileId,
    type: "team_member_added",
    title: "Novo membro na sua equipe",
    body: `${input.memberName} entrou na equipe ${input.teamName}.`
  });

  if (error) {
    throw new Error(error.message);
  }
}
