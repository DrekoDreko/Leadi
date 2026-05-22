import { describe, expect, it } from "vitest";
import type { Lead } from "@/data/mock";
import { getDashboardMetrics } from "./dashboard-home";

describe("getDashboardMetrics", () => {
  it("conta leads recebidos nos ultimos sete dias e destaca quantos seguem na etapa inicial", () => {
    const leads: Lead[] = [
      buildLead({
        id: "lead-1",
        stage: "Novo lead",
        receivedAt: "2026-05-21T09:00:00.000Z"
      }),
      buildLead({
        id: "lead-2",
        stage: "qualification",
        receivedAt: "2026-05-18T12:00:00.000Z"
      }),
      buildLead({
        id: "lead-3",
        stage: "new",
        receivedAt: "2026-05-10T08:00:00.000Z"
      }),
      buildLead({
        id: "lead-4",
        stage: "won",
        receivedAt: null
      })
    ];

    const metrics = getDashboardMetrics(leads, 4, 12, new Date("2026-05-21T15:00:00.000Z"));

    expect(metrics.newLeads).toBe("2");
    expect(metrics.newLeadsNote).toBe("ultimos 7 dias • 1 ainda em Novo lead");
    expect(metrics.activeLeads).toBe("3");
    expect(metrics.sales).toBe("1");
  });

  it("informa quando nao houve entrada recente", () => {
    const leads: Lead[] = [
      buildLead({
        id: "lead-9",
        stage: "Negociação",
        receivedAt: "2026-05-01T08:00:00.000Z"
      })
    ];

    const metrics = getDashboardMetrics(leads, 0, 0, new Date("2026-05-21T15:00:00.000Z"));

    expect(metrics.newLeads).toBe("0");
    expect(metrics.newLeadsNote).toBe("sem entradas nos ultimos 7 dias");
  });
});

function buildLead(overrides: Partial<Lead>): Lead {
  return {
    id: overrides.id ?? "lead-base",
    name: overrides.name ?? "Lead base",
    owner: overrides.owner ?? "Gabriel",
    stage: overrides.stage ?? "Novo lead",
    source: overrides.source ?? "Cadastro manual",
    phone: overrides.phone ?? "(11) 99999-0000",
    email: overrides.email ?? "lead@teste.com",
    city: overrides.city ?? "Sao Paulo",
    companyName: overrides.companyName ?? "Empresa Base",
    livesCount: overrides.livesCount ?? 10,
    createdAt: overrides.createdAt ?? "21 mai 2026",
    budget: overrides.budget ?? "R$ 2k/mês",
    interest: overrides.interest ?? "Plano PME",
    lastInteraction: overrides.lastInteraction ?? "Sem interacao registrada.",
    notes: overrides.notes ?? "Observacao base.",
    quality: overrides.quality ?? "medium",
    receivedAt: overrides.receivedAt ?? "2026-05-21T09:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-05-21T09:00:00.000Z",
    archivedAt: overrides.archivedAt ?? null,
    archiveReason: overrides.archiveReason ?? null,
    duplicateOfLeadId: overrides.duplicateOfLeadId ?? null,
    ownerProfileId: overrides.ownerProfileId ?? null,
    canEdit: overrides.canEdit ?? true,
    canDelete: overrides.canDelete ?? true,
    lossReason: overrides.lossReason ?? null,
    sourceCampaign: overrides.sourceCampaign ?? null,
    sourceAdset: overrides.sourceAdset ?? null,
    sourceAd: overrides.sourceAd ?? null,
    metaLeadId: overrides.metaLeadId ?? null,
    metaFormId: overrides.metaFormId ?? null,
    metaPageId: overrides.metaPageId ?? null,
    metaCampaignId: overrides.metaCampaignId ?? null,
    metaAdsetId: overrides.metaAdsetId ?? null,
    metaAdId: overrides.metaAdId ?? null,
    metaConnectedAccountId: overrides.metaConnectedAccountId ?? null
  };
}
