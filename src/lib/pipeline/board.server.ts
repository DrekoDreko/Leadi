import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceContext } from "@/lib/workspaces/context";
import { ApiRouteError } from "@/lib/api/route-security";
import { getLeadsForCurrentUser } from "@/lib/leads/repository.server";
import type { LeadDataState } from "@/lib/leads/repository";
import type { LeadUrlFilters } from "@/lib/leads/filters";
import { buildFallbackStages } from "@/lib/pipeline/canonical";
import { listPipelineStagesForCurrentUser } from "@/lib/pipeline/stages.server";
import { getLeadStageValue } from "@/lib/leads/stages";
import type { BoardLabel, BoardMember, LeadCover, PipelineStage } from "@/lib/pipeline/types";
import type { Lead } from "@/data/mock";
import type { Database, LeadStage } from "@/lib/supabase/database.types";

type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const OPEN_ENUM_STAGES: ReadonlySet<LeadStage> = new Set<LeadStage>([
  "new",
  "qualification",
  "proposal",
  "negotiation"
]);

export type SalesBoardData = {
  leadState: LeadDataState;
  stages: PipelineStage[];
};

/**
 * Carrega o board completo do funil: etapas + leads enriquecidos com
 * etiquetas, membros, contadores de checklist, capa e vencimento.
 */
export async function getSalesBoardForCurrentUser(
  filters: LeadUrlFilters
): Promise<SalesBoardData> {
  const [leadState, context] = await Promise.all([
    getLeadsForCurrentUser(filters),
    getCurrentWorkspaceContext()
  ]);

  // Modo mock/demo: deriva stageId a partir do enum e usa etapas de fallback.
  if (leadState.mode !== "supabase" || !context.profile) {
    return { leadState, stages: applyFallbackBoard(leadState.leads) };
  }

  // Modo Supabase. Se o schema do board ainda não foi aplicado (ex.: migrations
  // pendentes em produção), cai no fallback em vez de derrubar a página do funil.
  try {
    const supabase = await createSupabaseServerClient();
    const organizationId = context.profile.organization_id;

    const stages = await listPipelineStagesForCurrentUser();
    await enrichLeadsWithBoardData(supabase, organizationId, leadState.leads);

    return { leadState, stages };
  } catch (error) {
    console.error("[getSalesBoardForCurrentUser] Fallback do board (schema pendente?):", error);
    return { leadState, stages: applyFallbackBoard(leadState.leads) };
  }
}

/** Preenche os leads com valores de board padrão (colunas derivadas do enum). */
function applyFallbackBoard(leads: Lead[]): PipelineStage[] {
  for (const lead of leads) {
    lead.stageId = lead.stageId ?? getLeadStageValue(lead.stage) ?? "new";
    lead.boardPosition = lead.boardPosition ?? 0;
    lead.labels = lead.labels ?? [];
    lead.members = lead.members ?? [];
    lead.checklistTotal = lead.checklistTotal ?? 0;
    lead.checklistDone = lead.checklistDone ?? 0;
  }
  return buildFallbackStages();
}

/** Preenche labels, membros e contadores de checklist nos leads (in-place). */
async function enrichLeadsWithBoardData(
  supabase: ServerClient,
  organizationId: string,
  leads: Lead[]
): Promise<void> {
  const leadIds = leads.map((lead) => lead.id);
  if (leadIds.length === 0) {
    return;
  }

  const [labelsResult, assignmentsResult, membersResult, profilesResult, checklistResult] =
    await Promise.all([
      supabase
        .from("lead_labels")
        .select("id, name, color, position")
        .eq("organization_id", organizationId)
        .order("position", { ascending: true }),
      supabase
        .from("lead_label_assignments")
        .select("lead_id, label_id")
        .eq("organization_id", organizationId)
        .in("lead_id", leadIds),
      supabase
        .from("lead_members")
        .select("lead_id, profile_id")
        .eq("organization_id", organizationId)
        .in("lead_id", leadIds),
      supabase.from("profiles").select("id, full_name, avatar_url").eq("organization_id", organizationId),
      supabase
        .from("lead_checklist_items")
        .select("lead_id, done")
        .eq("organization_id", organizationId)
        .in("lead_id", leadIds)
    ]);

  const labelById = new Map<string, BoardLabel>();
  for (const row of labelsResult.data ?? []) {
    labelById.set(row.id, {
      id: row.id,
      name: row.name,
      color: row.color,
      position: Number(row.position)
    });
  }

  const labelsByLead = new Map<string, BoardLabel[]>();
  for (const row of assignmentsResult.data ?? []) {
    const label = labelById.get(row.label_id);
    if (!label) continue;
    const list = labelsByLead.get(row.lead_id) ?? [];
    list.push(label);
    labelsByLead.set(row.lead_id, list);
  }

  const profileById = new Map<string, { full_name: string | null; avatar_url: string | null }>();
  for (const row of profilesResult.data ?? []) {
    profileById.set(row.id, { full_name: row.full_name, avatar_url: row.avatar_url });
  }

  const membersByLead = new Map<string, BoardMember[]>();
  for (const row of membersResult.data ?? []) {
    const profile = profileById.get(row.profile_id);
    const list = membersByLead.get(row.lead_id) ?? [];
    list.push({
      profileId: row.profile_id,
      name: profile?.full_name ?? "Membro",
      avatarUrl: profile?.avatar_url ?? null
    });
    membersByLead.set(row.lead_id, list);
  }

  const checklistTotals = new Map<string, { total: number; done: number }>();
  for (const row of checklistResult.data ?? []) {
    const entry = checklistTotals.get(row.lead_id) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (row.done) entry.done += 1;
    checklistTotals.set(row.lead_id, entry);
  }

  for (const lead of leads) {
    lead.labels = (labelsByLead.get(lead.id) ?? []).sort((a, b) => a.position - b.position);
    lead.members = membersByLead.get(lead.id) ?? [];
    const counts = checklistTotals.get(lead.id);
    lead.checklistTotal = counts?.total ?? 0;
    lead.checklistDone = counts?.done ?? 0;
  }
}

/**
 * Deriva o valor do enum legado leads.stage a partir da etapa de destino,
 * mantendo métricas de conversão (venda/perdido) corretas mesmo em colunas
 * customizadas.
 */
function deriveEnumStage(
  targetSlug: string | null,
  targetType: "open" | "won" | "lost",
  currentEnum: LeadStage
): LeadStage {
  if (targetSlug) {
    const validSlug = getLeadStageValue(targetSlug);
    if (validSlug) return validSlug;
  }
  if (targetType === "won") return "won";
  if (targetType === "lost") return "lost";
  // Coluna aberta customizada: preserva o enum atual se já for "aberto",
  // senão cai para um estágio de progresso neutro.
  return OPEN_ENUM_STAGES.has(currentEnum) ? currentEnum : "qualification";
}

export type MoveLeadOnBoardInput = {
  stageId: string;
  position: number;
};

/** Move um lead para uma coluna/posição do board e sincroniza o enum + histórico. */
export async function moveLeadOnBoardForCurrentUser(
  leadId: string,
  input: MoveLeadOnBoardInput
): Promise<void> {
  const context = await getCurrentWorkspaceContext();
  if (context.mode !== "supabase" || !context.profile) {
    throw new ApiRouteError(400, "Board disponível apenas com o Supabase configurado.");
  }

  const supabase = await createSupabaseServerClient();
  const organizationId = context.profile.organization_id;
  const profileId = context.profile.id;

  const { data: stage, error: stageError } = await supabase
    .from("pipeline_stages")
    .select("id, slug, type")
    .eq("id", input.stageId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (stageError) {
    throw new Error(stageError.message);
  }
  if (!stage) {
    throw new ApiRouteError(400, "Coluna de destino inválida.");
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, stage, stage_id")
    .eq("id", leadId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (leadError) {
    throw new Error(leadError.message);
  }
  if (!lead) {
    throw new ApiRouteError(404, "Lead não encontrado.");
  }

  const nextEnum = deriveEnumStage(stage.slug, stage.type, lead.stage);

  const patch: Database["public"]["Tables"]["leads"]["Update"] = {
    stage_id: input.stageId,
    board_position: input.position,
    stage: nextEnum,
    updated_at: new Date().toISOString()
  };

  const { error: updateError } = await supabase
    .from("leads")
    .update(patch)
    .eq("id", leadId)
    .eq("organization_id", organizationId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  // Registra histórico apenas quando o enum efetivamente muda (compat. métricas).
  if (nextEnum !== lead.stage) {
    const { error: historyError } = await supabase.from("lead_stage_history").insert({
      organization_id: organizationId,
      lead_id: leadId,
      changed_by_profile_id: profileId,
      old_stage: lead.stage,
      new_stage: nextEnum
    });

    if (historyError) {
      console.error("[moveLeadOnBoard] Falha ao registrar histórico de etapa:", historyError);
    }
  }
}

export type UpdateLeadCardInput = {
  dueAt?: string | null;
  cover?: LeadCover | null;
};

/** Atualiza campos exclusivos do card (vencimento e capa). */
export async function updateLeadCardForCurrentUser(
  leadId: string,
  input: UpdateLeadCardInput
): Promise<void> {
  const context = await getCurrentWorkspaceContext();
  if (context.mode !== "supabase" || !context.profile) {
    throw new ApiRouteError(400, "Board disponível apenas com o Supabase configurado.");
  }

  const supabase = await createSupabaseServerClient();
  const organizationId = context.profile.organization_id;

  const patch: Database["public"]["Tables"]["leads"]["Update"] = {
    updated_at: new Date().toISOString()
  };
  if (input.dueAt !== undefined) {
    patch.due_at = input.dueAt;
  }
  if (input.cover !== undefined) {
    patch.cover = input.cover;
  }

  const { error } = await supabase
    .from("leads")
    .update(patch)
    .eq("id", leadId)
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(error.message);
  }
}
