import type { LeadStage } from "@/lib/supabase/database.types";

export type LeadStageValue = LeadStage;
export type LeadStageTone = "cobalt" | "lagoon" | "signal" | "ink" | "emerald" | "red";
export type LeadStageMeta = {
  value: LeadStage;
  label: string;
  description: string;
  tone: LeadStageTone;
};

export const leadStageOptions = [
  { value: "new", label: "Novo lead" },
  { value: "qualification", label: "Qualificação" },
  { value: "proposal", label: "Proposta" },
  { value: "negotiation", label: "Negociação" },
  { value: "won", label: "Venda" },
  { value: "lost", label: "Perdido" }
] as const satisfies ReadonlyArray<{ value: LeadStage; label: string }>;

const leadStageMetaByValue: Record<LeadStage, LeadStageMeta> = {
  new: {
    value: "new",
    label: "Novo lead",
    description: "Entrada e primeira abordagem",
    tone: "cobalt"
  },
  qualification: {
    value: "qualification",
    label: "Qualificação",
    description: "Diagnóstico comercial",
    tone: "lagoon"
  },
  proposal: {
    value: "proposal",
    label: "Proposta",
    description: "Simulação enviada",
    tone: "signal"
  },
  negotiation: {
    value: "negotiation",
    label: "Negociação",
    description: "Ajustes e objeções",
    tone: "ink"
  },
  won: {
    value: "won",
    label: "Venda",
    description: "Venda ganha",
    tone: "emerald"
  },
  lost: {
    value: "lost",
    label: "Perdido",
    description: "Perdidos ou sem avanço",
    tone: "red"
  }
};

const leadStageValueByLabel = new Map<string, LeadStage>(
  leadStageOptions.map((option) => [option.label, option.value])
);
const leadStageValues = new Set<LeadStage>(leadStageOptions.map((option) => option.value));

export function getLeadStageLabel(value: LeadStage | string) {
  return getLeadStageMeta(value)?.label ?? value;
}

export function getLeadStageValue(input: string): LeadStage | null {
  if (leadStageValues.has(input as LeadStage)) {
    return input as LeadStage;
  }

  return leadStageValueByLabel.get(input) ?? null;
}

export function getLeadStageMeta(input: LeadStage | string) {
  const value = getLeadStageValue(input);

  if (!value) {
    return null;
  }

  return leadStageMetaByValue[value];
}
