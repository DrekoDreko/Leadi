import { normalizeLeadQuality } from "./normalization";

const leadQualityMeta = {
  high: {
    value: "high",
    label: "Alta",
    description: "Lead com boa aderencia comercial e maior potencial de fechamento.",
    badgeClassName:
      "inline-flex items-center rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200/80"
  },
  medium: {
    value: "medium",
    label: "Media",
    description: "Lead promissor, mas ainda precisa de qualificacao complementar.",
    badgeClassName:
      "inline-flex items-center rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200/80"
  },
  low: {
    value: "low",
    label: "Baixa",
    description: "Lead com menor aderencia comercial ou baixo sinal de prioridade.",
    badgeClassName:
      "inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200/90"
  }
} as const;

export type LeadQualityValue = keyof typeof leadQualityMeta;

export const leadQualityOptions = Object.values(leadQualityMeta);

export function getLeadQualityMeta(value: unknown) {
  const normalized = normalizeLeadQuality(value);
  return normalized ? leadQualityMeta[normalized] : null;
}

export function getLeadQualityLabel(value: unknown) {
  return getLeadQualityMeta(value)?.label ?? "Nao classificada";
}
