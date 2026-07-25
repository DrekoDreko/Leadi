// As 6 etapas canônicas do funil (espelham o seed em pipeline_stages e o enum
// legado public.lead_stage). Usadas como fallback quando o board ainda não foi
// semeado ou o Supabase não está configurado (modo mock/demo).

import type { LeadStage } from "@/lib/supabase/database.types";
import type { BoardColorKey } from "@/lib/pipeline/colors";
import type { PipelineStage, PipelineStageType } from "@/lib/pipeline/types";

type CanonicalStage = {
  slug: LeadStage;
  name: string;
  color: BoardColorKey;
  type: PipelineStageType;
};

export const CANONICAL_STAGES: readonly CanonicalStage[] = [
  { slug: "new", name: "Novo lead", color: "cobalt", type: "open" },
  { slug: "qualification", name: "Qualificação", color: "lagoon", type: "open" },
  { slug: "proposal", name: "Proposta", color: "signal", type: "open" },
  { slug: "negotiation", name: "Negociação", color: "ink", type: "open" },
  { slug: "won", name: "Venda", color: "emerald", type: "won" },
  { slug: "lost", name: "Perdido", color: "red", type: "lost" }
] as const;

/** Constrói etapas de fallback (id = slug) para modo mock/demo. */
export function buildFallbackStages(): PipelineStage[] {
  return CANONICAL_STAGES.map((stage, index) => ({
    id: stage.slug,
    name: stage.name,
    slug: stage.slug,
    position: (index + 1) * 1000,
    color: stage.color,
    type: stage.type,
    isSystem: true,
    wipLimit: null
  }));
}

/** Mapeia o enum legado de etapa para o tipo de coluna (open/won/lost). */
export function stageTypeForSlug(slug: LeadStage): PipelineStageType {
  return CANONICAL_STAGES.find((stage) => stage.slug === slug)?.type ?? "open";
}
