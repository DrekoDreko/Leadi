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

  const rows = ((data as NotificationRow[] | null) ?? []).map(mapRow);
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
