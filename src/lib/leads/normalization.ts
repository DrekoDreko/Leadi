import type { LeadSource, LeadStage } from "@/lib/supabase/database.types";
import type { LeadQualityValue } from "./quality";

const allowedSources = new Set<LeadSource>([
  "manual",
  "csv_import",
  "meta_lead_ads",
  "make_zapier",
  "api"
]);

const sourceAliases = new Map<string, LeadSource>([
  ["cadastro manual", "manual"],
  ["manual", "manual"],
  ["lead manual", "manual"],
  ["csv importado", "csv_import"],
  ["csv", "csv_import"],
  ["csv import", "csv_import"],
  ["importacao csv", "csv_import"],
  ["importacao de csv", "csv_import"],
  ["meta lead form", "meta_lead_ads"],
  ["meta lead ads", "meta_lead_ads"],
  ["meta", "meta_lead_ads"],
  ["make zapier", "make_zapier"],
  ["make", "make_zapier"],
  ["zapier", "make_zapier"],
  ["api", "api"]
]);

const allowedStages = new Set<LeadStage>([
  "new",
  "qualification",
  "proposal",
  "negotiation",
  "won",
  "lost"
]);

const allowedLeadQualities = new Set<LeadQualityValue>(["high", "medium", "low"]);

export function normalizeEmail(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();
  return email.includes("@") ? email : null;
}

export function normalizePhone(value: unknown) {
  if (typeof value !== "string") {
    return { display: null, e164: null };
  }

  const display = value.trim();
  const digits = display.replace(/\D/g, "");

  if (!digits) {
    return { display: null, e164: null };
  }

  if (digits.startsWith("55")) {
    return { display, e164: `+${digits}` };
  }

  if (digits.length === 10 || digits.length === 11) {
    return { display, e164: `+55${digits}` };
  }

  return { display, e164: `+${digits}` };
}

export function normalizeLeadSource(value: unknown): LeadSource {
  return normalizeLeadSourceOrNull(value) ?? "manual";
}

export function normalizeLeadSourceOrNull(value: unknown): LeadSource | null {
  if (typeof value !== "string") {
    return null;
  }

  if (allowedSources.has(value as LeadSource)) {
    return value as LeadSource;
  }

  const normalizedValue = normalizeSourceValue(value);
  return sourceAliases.get(normalizedValue) ?? null;
}

export function normalizeLeadStage(value: unknown): LeadStage {
  return typeof value === "string" && allowedStages.has(value as LeadStage)
    ? (value as LeadStage)
    : "new";
}

export function normalizeLeadQuality(value: unknown): LeadQualityValue | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (allowedLeadQualities.has(normalized as LeadQualityValue)) {
    return normalized as LeadQualityValue;
  }

  switch (normalizeSourceValue(value)) {
    case "alta":
      return "high";
    case "media":
      return "medium";
    case "baixa":
      return "low";
    default:
      return null;
  }
}

export function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeSourceValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
