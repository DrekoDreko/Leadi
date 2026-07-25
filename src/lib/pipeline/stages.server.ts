import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceContext } from "@/lib/workspaces/context";
import { ApiRouteError } from "@/lib/api/route-security";
import { buildFallbackStages } from "@/lib/pipeline/canonical";
import { DEFAULT_BOARD_COLOR, isBoardColorKey } from "@/lib/pipeline/colors";
import { POSITION_STEP } from "@/lib/pipeline/position";
import type { PipelineStage, PipelineStageType } from "@/lib/pipeline/types";
import type { Database } from "@/lib/supabase/database.types";

type PipelineStageRow = Database["public"]["Tables"]["pipeline_stages"]["Row"];

function mapStageRow(row: PipelineStageRow): PipelineStage {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    position: Number(row.position),
    color: row.color,
    type: row.type,
    isSystem: row.is_system,
    wipLimit: row.wip_limit
  };
}

async function requireManagerContext() {
  const context = await getCurrentWorkspaceContext();

  if (context.mode !== "supabase" || !context.profile) {
    throw new ApiRouteError(400, "Board disponível apenas com o Supabase configurado.");
  }

  if (!context.isManager) {
    throw new ApiRouteError(403, "Somente owner ou admin podem gerenciar as colunas do funil.");
  }

  return { context, organizationId: context.profile.organization_id };
}

/** Lista as colunas do funil da organização (com fallback para modo mock/demo). */
export async function listPipelineStagesForCurrentUser(): Promise<PipelineStage[]> {
  const context = await getCurrentWorkspaceContext();

  if (context.mode !== "supabase" || !context.profile) {
    return buildFallbackStages();
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pipeline_stages")
    .select("*")
    .eq("organization_id", context.profile.organization_id)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return buildFallbackStages();
  }

  return data.map(mapStageRow);
}

export type CreatePipelineStageInput = {
  name: string;
  color?: string;
  type?: PipelineStageType;
  afterStageId?: string | null;
};

export async function createPipelineStageForCurrentUser(
  input: CreatePipelineStageInput
): Promise<PipelineStage> {
  const { organizationId } = await requireManagerContext();
  const supabase = await createSupabaseServerClient();

  const name = input.name.trim();
  if (!name) {
    throw new ApiRouteError(400, "Informe um nome para a coluna.");
  }

  const color = input.color && isBoardColorKey(input.color) ? input.color : DEFAULT_BOARD_COLOR;
  const type: PipelineStageType = input.type ?? "open";

  // Nova coluna vai para o fim por padrão.
  const { data: last } = await supabase
    .from("pipeline_stages")
    .select("position")
    .eq("organization_id", organizationId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = (last ? Number(last.position) : 0) + POSITION_STEP;

  const { data, error } = await supabase
    .from("pipeline_stages")
    .insert({ organization_id: organizationId, name, color, type, position })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapStageRow(data);
}

export type UpdatePipelineStageInput = {
  name?: string;
  color?: string;
  type?: PipelineStageType;
  wipLimit?: number | null;
  position?: number;
};

export async function updatePipelineStageForCurrentUser(
  id: string,
  input: UpdatePipelineStageInput
): Promise<PipelineStage> {
  const { organizationId } = await requireManagerContext();
  const supabase = await createSupabaseServerClient();

  const patch: Database["public"]["Tables"]["pipeline_stages"]["Update"] = {};

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) {
      throw new ApiRouteError(400, "O nome da coluna não pode ficar vazio.");
    }
    patch.name = name;
  }
  if (input.color !== undefined) {
    patch.color = isBoardColorKey(input.color) ? input.color : DEFAULT_BOARD_COLOR;
  }
  if (input.type !== undefined) {
    patch.type = input.type;
  }
  if (input.wipLimit !== undefined) {
    patch.wip_limit = input.wipLimit;
  }
  if (input.position !== undefined) {
    patch.position = input.position;
  }

  if (Object.keys(patch).length === 0) {
    throw new ApiRouteError(400, "Nenhuma alteração informada para a coluna.");
  }

  const { data, error } = await supabase
    .from("pipeline_stages")
    .update(patch)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapStageRow(data);
}

/** Reordena colunas atribuindo posições sequenciais na ordem informada. */
export async function reorderPipelineStagesForCurrentUser(orderedIds: string[]): Promise<void> {
  const { organizationId } = await requireManagerContext();
  const supabase = await createSupabaseServerClient();

  await Promise.all(
    orderedIds.map((stageId, index) =>
      supabase
        .from("pipeline_stages")
        .update({ position: (index + 1) * POSITION_STEP })
        .eq("id", stageId)
        .eq("organization_id", organizationId)
    )
  );
}

/**
 * Exclui uma coluna. Se houver leads nela, é obrigatório informar
 * `reassignToStageId` para onde os cards serão movidos.
 */
export async function deletePipelineStageForCurrentUser(
  id: string,
  reassignToStageId?: string | null
): Promise<void> {
  const { organizationId } = await requireManagerContext();
  const supabase = await createSupabaseServerClient();

  const { data: stages, error: stagesError } = await supabase
    .from("pipeline_stages")
    .select("id")
    .eq("organization_id", organizationId);

  if (stagesError) {
    throw new Error(stagesError.message);
  }

  if (!stages || stages.length <= 1) {
    throw new ApiRouteError(400, "O funil precisa ter pelo menos uma coluna.");
  }

  const { count } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("stage_id", id)
    .is("archived_at", null);

  if (count && count > 0) {
    if (!reassignToStageId || reassignToStageId === id) {
      throw new ApiRouteError(
        400,
        "Esta coluna tem cards. Escolha para qual coluna movê-los antes de excluir."
      );
    }

    const target = stages.find((stage) => stage.id === reassignToStageId);
    if (!target) {
      throw new ApiRouteError(400, "Coluna de destino inválida.");
    }

    const { error: moveError } = await supabase
      .from("leads")
      .update({ stage_id: reassignToStageId })
      .eq("organization_id", organizationId)
      .eq("stage_id", id);

    if (moveError) {
      throw new Error(moveError.message);
    }
  }

  const { error: deleteError } = await supabase
    .from("pipeline_stages")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }
}
