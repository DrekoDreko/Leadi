import type { LeadStage } from "@/lib/supabase/database.types";

export type LeadStageValue = LeadStage;

export const leadStageOptions = [
  { value: "new", label: "Novo lead" },
  { value: "qualification", label: "Qualificação" },
  { value: "proposal", label: "Proposta" },
  { value: "negotiation", label: "Negociação" },
  { value: "won", label: "Venda" },
  { value: "lost", label: "Perdido" }
] as const satisfies ReadonlyArray<{ value: LeadStage; label: string }>;

const leadStageLabelByValue: Record<LeadStage, string> = {
  new: "Novo lead",
  qualification: "Qualificação",
  proposal: "Proposta",
  negotiation: "Negociação",
  won: "Venda",
  lost: "Perdido"
};

const leadStageValueByLabel = new Map<string, LeadStage>(
  leadStageOptions.map((option) => [option.label, option.value])
);

export function getLeadStageLabel(value: LeadStage | string) {
  return leadStageLabelByValue[value as LeadStage] ?? value;
}

export function getLeadStageValue(label: string): LeadStage | null {
  return leadStageValueByLabel.get(label) ?? null;
}
