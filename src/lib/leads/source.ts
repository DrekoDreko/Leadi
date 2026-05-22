import type { Lead } from "@/data/mock";

type LeadOriginSource = Pick<
  Lead,
  | "source"
  | "sourceCampaign"
  | "sourceAdset"
  | "sourceAd"
  | "metaCampaignId"
  | "metaAdsetId"
  | "metaAdId"
  | "metaFormId"
>;

export type LeadOriginKind = "manual" | "csv" | "meta" | "automation" | "api" | "other";

export type LeadOriginDetail = {
  label: "Campanha" | "Conjunto" | "Anuncio" | "Formulario";
  value: string;
};

export function getLeadOriginKind(source: string): LeadOriginKind {
  switch (source) {
    case "Cadastro manual":
      return "manual";
    case "CSV importado":
      return "csv";
    case "Meta Lead Form":
      return "meta";
    case "Make/Zapier":
      return "automation";
    case "API":
      return "api";
    default:
      return "other";
  }
}

export function getLeadOriginDescription(source: string) {
  switch (getLeadOriginKind(source)) {
    case "manual":
      return "Lead cadastrado manualmente pela equipe no CRM.";
    case "csv":
      return "Lead importado por planilha, com origem consolidada pelo CSV.";
    case "meta":
      return "Lead captado pela integracao da Meta, com campanha, anuncio e formulario quando disponiveis.";
    case "automation":
      return "Lead recebido por automacao externa conectada ao workspace.";
    case "api":
      return "Lead recebido por integracao de API.";
    case "other":
    default:
      return "Origem do lead disponivel conforme os dados consolidados no CRM.";
  }
}

export function getLeadOriginBadgeClassName(source: string) {
  switch (getLeadOriginKind(source)) {
    case "manual":
      return "inline-flex items-center rounded-full bg-white/78 px-2.5 py-1 text-[11px] font-semibold text-ink/68 ring-1 ring-inset ring-black/5";
    case "csv":
      return "inline-flex items-center rounded-full bg-signal/16 px-2.5 py-1 text-[11px] font-semibold text-ink ring-1 ring-inset ring-signal/18";
    case "meta":
      return "inline-flex items-center rounded-full bg-cobalt/12 px-2.5 py-1 text-[11px] font-semibold text-cobalt ring-1 ring-inset ring-cobalt/18";
    case "automation":
      return "inline-flex items-center rounded-full bg-lagoon/16 px-2.5 py-1 text-[11px] font-semibold text-ink ring-1 ring-inset ring-lagoon/18";
    case "api":
      return "inline-flex items-center rounded-full bg-ink/10 px-2.5 py-1 text-[11px] font-semibold text-ink ring-1 ring-inset ring-ink/12";
    case "other":
    default:
      return "inline-flex items-center rounded-full bg-white/78 px-2.5 py-1 text-[11px] font-semibold text-ink/68 ring-1 ring-inset ring-black/5";
  }
}

export function getLeadOriginDetails(lead: LeadOriginSource): LeadOriginDetail[] {
  const details: LeadOriginDetail[] = [];
  const campaign = firstNonEmpty(lead.sourceCampaign, lead.metaCampaignId);
  const adset = firstNonEmpty(lead.sourceAdset, lead.metaAdsetId);
  const ad = firstNonEmpty(lead.sourceAd, lead.metaAdId);
  const form = firstNonEmpty(lead.metaFormId);

  if (campaign) {
    details.push({ label: "Campanha", value: campaign });
  }

  if (adset) {
    details.push({ label: "Conjunto", value: adset });
  }

  if (ad) {
    details.push({ label: "Anuncio", value: ad });
  }

  if (form) {
    details.push({ label: "Formulario", value: form });
  }

  return details;
}

export function getLeadOriginSummary(lead: LeadOriginSource) {
  const details = getLeadOriginDetails(lead);

  if (details.length === 0) {
    switch (getLeadOriginKind(lead.source)) {
      case "manual":
        return "Cadastro direto no CRM";
      case "csv":
        return "Importado por CSV";
      case "meta":
        return "Captado pela Meta Lead Ads";
      case "automation":
        return "Recebido por automacao";
      case "api":
        return "Recebido por API";
      case "other":
      default:
        return lead.source;
    }
  }

  return details
    .slice(0, 2)
    .map((detail) => `${detail.label}: ${detail.value}`)
    .join(" • ");
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalizedValue = value?.trim();

    if (normalizedValue) {
      return normalizedValue;
    }
  }

  return null;
}
