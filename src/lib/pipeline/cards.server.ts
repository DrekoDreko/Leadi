import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceContext } from "@/lib/workspaces/context";
import { ApiRouteError } from "@/lib/api/route-security";
import { DEFAULT_BOARD_COLOR, isBoardColorKey } from "@/lib/pipeline/colors";
import { POSITION_STEP } from "@/lib/pipeline/position";
import type { BoardChecklist, BoardLabel } from "@/lib/pipeline/types";

async function requireBoardContext() {
  const context = await getCurrentWorkspaceContext();
  if (context.mode !== "supabase" || !context.profile) {
    throw new ApiRouteError(400, "Board disponível apenas com o Supabase configurado.");
  }
  const supabase = await createSupabaseServerClient();
  return { context, supabase, organizationId: context.profile.organization_id };
}

// ─────────────────────────────── Etiquetas ───────────────────────────────

export async function listLabelsForCurrentUser(): Promise<BoardLabel[]> {
  const context = await getCurrentWorkspaceContext();
  if (context.mode !== "supabase" || !context.profile) {
    return [];
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lead_labels")
    .select("id, name, color, position")
    .eq("organization_id", context.profile.organization_id)
    .order("position", { ascending: true });

  // Schema do board ainda não aplicado: degrada para lista vazia sem quebrar a página.
  if (error) return [];
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    position: Number(row.position)
  }));
}

export async function createLabelForCurrentUser(input: {
  name: string;
  color?: string;
}): Promise<BoardLabel> {
  const { supabase, organizationId, context } = await requireBoardContext();
  if (!context.isManager) {
    throw new ApiRouteError(403, "Somente owner ou admin podem criar etiquetas.");
  }

  const color = input.color && isBoardColorKey(input.color) ? input.color : DEFAULT_BOARD_COLOR;

  const { data: last } = await supabase
    .from("lead_labels")
    .select("position")
    .eq("organization_id", organizationId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = (last ? Number(last.position) : 0) + POSITION_STEP;

  const { data, error } = await supabase
    .from("lead_labels")
    .insert({ organization_id: organizationId, name: input.name.trim(), color, position })
    .select("id, name, color, position")
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id, name: data.name, color: data.color, position: Number(data.position) };
}

export async function updateLabelForCurrentUser(
  id: string,
  input: { name?: string; color?: string }
): Promise<BoardLabel> {
  const { supabase, organizationId, context } = await requireBoardContext();
  if (!context.isManager) {
    throw new ApiRouteError(403, "Somente owner ou admin podem editar etiquetas.");
  }

  const patch: { name?: string; color?: string } = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.color !== undefined) {
    patch.color = isBoardColorKey(input.color) ? input.color : DEFAULT_BOARD_COLOR;
  }
  if (Object.keys(patch).length === 0) {
    throw new ApiRouteError(400, "Nenhuma alteração informada para a etiqueta.");
  }

  const { data, error } = await supabase
    .from("lead_labels")
    .update(patch)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select("id, name, color, position")
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id, name: data.name, color: data.color, position: Number(data.position) };
}

export async function deleteLabelForCurrentUser(id: string): Promise<void> {
  const { supabase, organizationId, context } = await requireBoardContext();
  if (!context.isManager) {
    throw new ApiRouteError(403, "Somente owner ou admin podem excluir etiquetas.");
  }
  const { error } = await supabase
    .from("lead_labels")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);
  if (error) throw new Error(error.message);
}

/** Aplica ou remove uma etiqueta de um lead. */
export async function setLeadLabelForCurrentUser(
  leadId: string,
  labelId: string,
  attached: boolean
): Promise<void> {
  const { supabase, organizationId } = await requireBoardContext();

  if (attached) {
    const { error } = await supabase
      .from("lead_label_assignments")
      .upsert(
        { lead_id: leadId, label_id: labelId, organization_id: organizationId },
        { onConflict: "lead_id,label_id" }
      );
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("lead_label_assignments")
      .delete()
      .eq("lead_id", leadId)
      .eq("label_id", labelId)
      .eq("organization_id", organizationId);
    if (error) throw new Error(error.message);
  }
}

// ─────────────────────────────── Membros ───────────────────────────────

export async function setLeadMemberForCurrentUser(
  leadId: string,
  profileId: string,
  attached: boolean
): Promise<void> {
  const { supabase, organizationId } = await requireBoardContext();

  if (attached) {
    const { error } = await supabase
      .from("lead_members")
      .upsert(
        { lead_id: leadId, profile_id: profileId, organization_id: organizationId },
        { onConflict: "lead_id,profile_id" }
      );
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("lead_members")
      .delete()
      .eq("lead_id", leadId)
      .eq("profile_id", profileId)
      .eq("organization_id", organizationId);
    if (error) throw new Error(error.message);
  }
}

// ─────────────────────────────── Checklists ───────────────────────────────

export async function listChecklistsForLead(leadId: string): Promise<BoardChecklist[]> {
  const { supabase, organizationId } = await requireBoardContext();

  const [checklistsResult, itemsResult] = await Promise.all([
    supabase
      .from("lead_checklists")
      .select("id, title, position")
      .eq("organization_id", organizationId)
      .eq("lead_id", leadId)
      .order("position", { ascending: true }),
    supabase
      .from("lead_checklist_items")
      .select("id, checklist_id, text, done, position")
      .eq("organization_id", organizationId)
      .eq("lead_id", leadId)
      .order("position", { ascending: true })
  ]);

  if (checklistsResult.error) throw new Error(checklistsResult.error.message);
  if (itemsResult.error) throw new Error(itemsResult.error.message);

  const itemsByChecklist = new Map<string, BoardChecklist["items"]>();
  for (const item of itemsResult.data ?? []) {
    const list = itemsByChecklist.get(item.checklist_id) ?? [];
    list.push({
      id: item.id,
      text: item.text,
      done: item.done,
      position: Number(item.position)
    });
    itemsByChecklist.set(item.checklist_id, list);
  }

  return (checklistsResult.data ?? []).map((checklist) => ({
    id: checklist.id,
    title: checklist.title,
    position: Number(checklist.position),
    items: itemsByChecklist.get(checklist.id) ?? []
  }));
}

export async function createChecklistForLead(
  leadId: string,
  title: string
): Promise<BoardChecklist> {
  const { supabase, organizationId } = await requireBoardContext();

  const { data: last } = await supabase
    .from("lead_checklists")
    .select("position")
    .eq("organization_id", organizationId)
    .eq("lead_id", leadId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = (last ? Number(last.position) : 0) + POSITION_STEP;

  const { data, error } = await supabase
    .from("lead_checklists")
    .insert({
      organization_id: organizationId,
      lead_id: leadId,
      title: title.trim() || "Checklist",
      position
    })
    .select("id, title, position")
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id, title: data.title, position: Number(data.position), items: [] };
}

export async function deleteChecklistForCurrentUser(id: string): Promise<void> {
  const { supabase, organizationId } = await requireBoardContext();
  const { error } = await supabase
    .from("lead_checklists")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);
  if (error) throw new Error(error.message);
}

export async function addChecklistItemForCurrentUser(input: {
  checklistId: string;
  leadId: string;
  text: string;
}): Promise<void> {
  const { supabase, organizationId } = await requireBoardContext();

  const { data: last } = await supabase
    .from("lead_checklist_items")
    .select("position")
    .eq("organization_id", organizationId)
    .eq("checklist_id", input.checklistId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = (last ? Number(last.position) : 0) + POSITION_STEP;

  const { error } = await supabase.from("lead_checklist_items").insert({
    organization_id: organizationId,
    checklist_id: input.checklistId,
    lead_id: input.leadId,
    text: input.text.trim(),
    position
  });

  if (error) throw new Error(error.message);
}

export async function updateChecklistItemForCurrentUser(
  id: string,
  input: { text?: string; done?: boolean }
): Promise<void> {
  const { supabase, organizationId } = await requireBoardContext();

  const patch: { text?: string; done?: boolean } = {};
  if (input.text !== undefined) patch.text = input.text.trim();
  if (input.done !== undefined) patch.done = input.done;
  if (Object.keys(patch).length === 0) {
    throw new ApiRouteError(400, "Nenhuma alteração informada para o item.");
  }

  const { error } = await supabase
    .from("lead_checklist_items")
    .update(patch)
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) throw new Error(error.message);
}

export async function deleteChecklistItemForCurrentUser(id: string): Promise<void> {
  const { supabase, organizationId } = await requireBoardContext();
  const { error } = await supabase
    .from("lead_checklist_items")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);
  if (error) throw new Error(error.message);
}
