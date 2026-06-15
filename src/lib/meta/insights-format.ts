import type { InsightDatePreset } from "@/lib/meta/insights.server";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const numberFormatter = new Intl.NumberFormat("pt-BR");

export function formatBRL(value: number): string {
  return currencyFormatter.format(value);
}

export function formatInteger(value: number): string {
  return numberFormatter.format(Math.round(value));
}

export function formatPercent(value: number): string {
  return `${numberFormatter.format(Math.round(value * 100) / 100)}%`;
}

export function formatCostPerLead(value: number | null): string {
  return value === null ? "—" : currencyFormatter.format(value);
}

export const DATE_PRESET_LABELS: Record<InsightDatePreset, string> = {
  today: "Hoje",
  last_7d: "7 dias",
  last_30d: "30 dias",
  maximum: "Tudo"
};

export const DATE_PRESET_ORDER: InsightDatePreset[] = [
  "today",
  "last_7d",
  "last_30d",
  "maximum"
];
