export type LeadScoreSignal = {
  label: string;
  points: number;
  detail: string;
};

export type LeadScoreBand = "low" | "warm" | "hot" | "priority";

export type LeadScoreResult = {
  score: number;
  band: LeadScoreBand;
  bandLabel: string;
  summary: string;
  signals: LeadScoreSignal[];
};

export type LeadScoringInput = {
  stage?: string | null;
  source?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  companyName?: string | null;
  livesCount?: number | null;
  budget?: string | null;
  interest?: string | null;
  lastInteraction?: string | null;
  notes?: string | null;
  nextContactAt?: string | null;
  receivedAt?: string | null;
};

type NormalizedLeadStage = "new" | "qualification" | "proposal" | "negotiation" | "won" | "lost";
type NormalizedLeadSource = "manual" | "csv_import" | "meta_lead_ads" | "make_zapier" | "api";

const stageLabels: Record<NormalizedLeadStage, string> = {
  new: "Novo lead",
  qualification: "Qualificação",
  proposal: "Proposta",
  negotiation: "Negociação",
  won: "Venda",
  lost: "Perdido"
};

const sourceLabels: Record<NormalizedLeadSource, string> = {
  manual: "Cadastro manual",
  csv_import: "CSV importado",
  meta_lead_ads: "Meta Lead Form",
  make_zapier: "Make/Zapier",
  api: "API"
};

const emptyFieldValues = new Set([
  "",
  "sem telefone",
  "sem email",
  "empresa nao informada",
  "cidade nao informada",
  "a qualificar",
  "interesse ainda nao qualificado",
  "lead recebido no crm.",
  "sem observacoes registradas.",
  "lead cadastrado manualmente no modo demonstracao.",
  "lead atualizado no modo demonstracao."
]);

export function calculateLeadScore(input: LeadScoringInput): LeadScoreResult {
  const signals: LeadScoreSignal[] = [];

  addSignal(signals, resolveSourceSignal(input.source));
  addSignal(signals, resolveProfileSignals(input));
  addSignal(signals, resolveIntentSignals(input));
  addSignal(signals, resolveTimingSignals(input));

  const score = clampScore(signals.reduce((total, signal) => total + signal.points, 0));

  return {
    score,
    band: getLeadScoreBand(score),
    bandLabel: getLeadScoreBandLabel(score),
    summary: buildLeadScoreSummary(signals, score),
    signals: signals
      .filter((signal) => signal.points !== 0)
      .sort((left, right) => Math.abs(right.points) - Math.abs(left.points))
  };
}

export function getLeadScoreBand(score: number): LeadScoreBand {
  if (score >= 85) {
    return "priority";
  }

  if (score >= 70) {
    return "hot";
  }

  if (score >= 50) {
    return "warm";
  }

  return "low";
}

export function getLeadScoreBandLabel(score: number) {
  switch (getLeadScoreBand(score)) {
    case "priority":
      return "Prioridade máxima";
    case "hot":
      return "Quente";
    case "warm":
      return "Em atenção";
    default:
      return "Baixa prioridade";
  }
}

export function formatLeadScorePercentage(score: number) {
  return `${clampScore(score)}%`;
}

function resolveSourceSignal(source?: string | null): LeadScoreSignal | null {
  const normalizedSource = normalizeLeadSource(source);

  if (!normalizedSource) {
    return null;
  }

  const pointsBySource: Record<NormalizedLeadSource, number> = {
    manual: 4,
    csv_import: 6,
    meta_lead_ads: 14,
    make_zapier: 8,
    api: 10
  };

  return {
    label: `Origem ${sourceLabels[normalizedSource]}`,
    points: pointsBySource[normalizedSource],
    detail: "Origem do lead"
  };
}

function resolveProfileSignals(input: LeadScoringInput): LeadScoreSignal[] {
  const signals: LeadScoreSignal[] = [];

  if (hasMeaningfulText(input.companyName)) {
    signals.push({
      label: "Empresa informada",
      points: 8,
      detail: "Empresa vinculada ao lead"
    });
  }

  if (hasMeaningfulText(input.email) && hasMeaningfulText(input.phone)) {
    signals.push({
      label: "Contato completo",
      points: 8,
      detail: "Telefone e email presentes"
    });
  } else if (hasMeaningfulText(input.email) || hasMeaningfulText(input.phone)) {
    signals.push({
      label: "Contato parcial",
      points: 4,
      detail: "Ao menos um canal de contato valido"
    });
  }

  if (hasMeaningfulText(input.city)) {
    signals.push({
      label: "Cidade informada",
      points: 2,
      detail: "Origem geográfica conhecida"
    });
  }

  if (hasMeaningfulText(input.budget)) {
    signals.push({
      label: "Orçamento declarado",
      points: 3,
      detail: "Faixa de investimento registrada"
    });
  }

  const livesSignal = resolveLivesSignal(input.livesCount);
  if (livesSignal) {
    signals.push(livesSignal);
  }

  return signals;
}

function resolveLivesSignal(livesCount?: number | null): LeadScoreSignal | null {
  if (typeof livesCount !== "number" || !Number.isFinite(livesCount) || livesCount <= 0) {
    return null;
  }

  if (livesCount >= 100) {
    return {
      label: "Carteira grande",
      points: 16,
      detail: "100+ vidas"
    };
  }

  if (livesCount >= 50) {
    return {
      label: "Carteira relevante",
      points: 14,
      detail: "50 a 99 vidas"
    };
  }

  if (livesCount >= 20) {
    return {
      label: "Potencial médio",
      points: 12,
      detail: "20 a 49 vidas"
    };
  }

  return {
    label: "Entrada qualificada",
    points: 8,
    detail: "Até 19 vidas"
  };
}

function resolveIntentSignals(input: LeadScoringInput): LeadScoreSignal[] {
  const signals: LeadScoreSignal[] = [];
  const stage = normalizeStage(input.stage);

  if (stage && stage !== "new") {
    const pointsByStage: Record<Exclude<NormalizedLeadStage, "new">, number> = {
      qualification: 3,
      proposal: 6,
      negotiation: 10,
      won: 14,
      lost: -18
    };

    signals.push({
      label: `Etapa ${stageLabels[stage]}`,
      points: pointsByStage[stage],
      detail: "Posição atual no funil"
    });
  }

  if (hasMeaningfulText(input.interest)) {
    signals.push({
      label: "Interesse claro",
      points: 8,
      detail: "Necessidade comercial registrada"
    });
  }

  if (hasMeaningfulText(input.lastInteraction)) {
    signals.push({
      label: "Interação recente",
      points: 6,
      detail: "Ultimo contato registrado"
    });
  }

  if (hasMeaningfulText(input.notes)) {
    signals.push({
      label: "Observações úteis",
      points: 3,
      detail: "Contexto adicional anotado"
    });
  }

  return signals;
}

function resolveTimingSignals(input: LeadScoringInput): LeadScoreSignal[] {
  const signals: LeadScoreSignal[] = [];

  const nextContactAt = parseDate(input.nextContactAt);
  if (nextContactAt) {
    const now = Date.now();
    if (nextContactAt.getTime() >= now) {
      signals.push({
        label: "Próximo contato agendado",
        points: 4,
        detail: "Follow-up previsto no futuro"
      });
    } else {
      signals.push({
        label: "Follow-up atrasado",
        points: -3,
        detail: "Próximo contato vencido"
      });
    }
  }

  const receivedAt = parseDate(input.receivedAt);
  if (receivedAt) {
    const now = Date.now();
    const ageInDays = (now - receivedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (ageInDays <= 7) {
      signals.push({
        label: "Lead muito recente",
        points: 5,
        detail: "Recebido nos últimos 7 dias"
      });
    } else if (ageInDays <= 30) {
      signals.push({
        label: "Lead recente",
        points: 3,
        detail: "Recebido nos últimos 30 dias"
      });
    }
  }

  return signals;
}

function addSignal(target: LeadScoreSignal[], signal: LeadScoreSignal | LeadScoreSignal[] | null) {
  if (!signal) {
    return;
  }

  if (Array.isArray(signal)) {
    target.push(...signal);
    return;
  }

  target.push(signal);
}

function buildLeadScoreSummary(signals: LeadScoreSignal[], score: number) {
  const positives = signals.filter((signal) => signal.points > 0);
  const negatives = signals.filter((signal) => signal.points < 0);
  const positiveSummary = positives.slice(0, 3).map((signal) => signal.label.toLowerCase());

  if (score >= 85) {
    return positiveSummary.length
      ? `Lead muito forte por ${joinSentences(positiveSummary)}.`
      : "Lead muito forte para abordagem prioritária.";
  }

  if (score >= 70) {
    return positiveSummary.length
      ? `Lead qualificado por ${joinSentences(positiveSummary)}.`
      : "Lead qualificado para abordagem ativa.";
  }

  if (score >= 50) {
    return positives.length
      ? `Lead em evolução com sinais de ${joinSentences(positiveSummary)}.`
      : "Lead em evolução, mas ainda precisa de sinais mais fortes.";
  }

  if (negatives.length) {
    return `Lead com sinais fracos e pontos de atenção como ${joinSentences(
      negatives.slice(0, 2).map((signal) => signal.label.toLowerCase())
    )}.`;
  }

  return "Lead ainda com poucos sinais de prioridade.";
}

function joinSentences(values: string[]) {
  if (values.length <= 1) {
    return values[0] ?? "";
  }

  if (values.length === 2) {
    return `${values[0]} e ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")} e ${values.at(-1)}`;
}

function normalizeLeadSource(value?: string | null): NormalizedLeadSource | null {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return null;
  }

  const directMatch = Object.keys(sourceLabels).find((key) => key === normalizedValue);
  if (directMatch) {
    return directMatch as NormalizedLeadSource;
  }

  const aliasMap: Record<string, NormalizedLeadSource> = {
    "cadastro manual": "manual",
    manual: "manual",
    "lead manual": "manual",
    "csv importado": "csv_import",
    csv: "csv_import",
    "csv import": "csv_import",
    "importacao csv": "csv_import",
    "importacao de csv": "csv_import",
    "meta lead form": "meta_lead_ads",
    "meta lead ads": "meta_lead_ads",
    meta: "meta_lead_ads",
    "make zapier": "make_zapier",
    make: "make_zapier",
    zapier: "make_zapier",
    api: "api"
  };

  return aliasMap[normalizedValue] ?? null;
}

function normalizeStage(value?: string | null): NormalizedLeadStage | null {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) {
    return null;
  }

  const directMatch = Object.keys(stageLabels).find((key) => key === normalizedValue);
  if (directMatch) {
    return directMatch as NormalizedLeadStage;
  }

  const aliasMap: Record<string, NormalizedLeadStage> = {
    "novo lead": "new",
    qualificacao: "qualification",
    "qualificação": "qualification",
    proposta: "proposal",
    negociacao: "negotiation",
    "negociação": "negotiation",
    venda: "won",
    perdido: "lost"
  };

  return aliasMap[normalizedValue] ?? null;
}

function hasMeaningfulText(value?: string | null) {
  const normalizedValue = normalizeText(value);
  return Boolean(normalizedValue) && !emptyFieldValues.has(normalizedValue);
}

function normalizeText(value?: string | null) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function parseDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function clampScore(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}
