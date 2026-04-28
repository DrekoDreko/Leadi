import type { LeadSource, LeadStage } from "@/lib/supabase/database.types";

const allowedSources = new Set<LeadSource>([
  "manual",
  "csv_import",
  "meta_lead_ads",
  "make_zapier",
  "api"
]);

const allowedStages = new Set<LeadStage>([
  "new",
  "qualification",
  "proposal",
  "negotiation",
  "won",
  "lost"
]);

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
  return typeof value === "string" && allowedSources.has(value as LeadSource)
    ? (value as LeadSource)
    : "manual";
}

export function normalizeLeadStage(value: unknown): LeadStage {
  return typeof value === "string" && allowedStages.has(value as LeadStage)
    ? (value as LeadStage)
    : "new";
}

export function normalizeScore(value: unknown) {
  const score = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(score)) {
    return 50;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

export function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
